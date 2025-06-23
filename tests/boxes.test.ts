import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Center: Prague, Czechia (lat: 50.087, lng: 14.421)
// Box 2: ~55m east (lng: 14.4217)
// Box 3: ~570m east (lng: 14.429)
const TEST_BOXES = [
  {
    id: 'test-box-1',
    code: 'TEST1',
    name: 'Test Box 1',
    address: 'Test Address 1',
    location: { type: 'Point', coordinates: [14.421, 50.087] }, // center
    status: 'active',
  },
  {
    id: 'test-box-2',
    code: 'TEST2',
    name: 'Test Box 2',
    address: 'Test Address 2',
    location: { type: 'Point', coordinates: [14.4217, 50.087] }, // ~55m east
    status: 'active',
  },
  {
    id: 'test-box-3',
    code: 'TEST3',
    name: 'Test Box 3',
    address: 'Test Address 3',
    location: { type: 'Point', coordinates: [14.429, 50.087] }, // ~570m east
    status: 'active',
  },
];

describe('GET /boxes/nearest', () => {
  beforeEach(async () => {
    // Clean up all test boxes by id
    const ids = TEST_BOXES.map(b => `'${b.id}'`).join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM "Box" WHERE id IN (${ids})`);
    // Insert all test boxes
    for (const box of TEST_BOXES) {
      await prisma.$executeRaw`
        INSERT INTO "Box" (id, code, name, address, location, status)
        VALUES (${box.id}, ${box.code}, ${box.name}, ${box.address},
          ST_SetSRID(ST_MakePoint(${box.location.coordinates[0]}, ${box.location.coordinates[1]}), 4326)::geography, ${box.status})
      `;
    }
  });

  afterEach(async () => {
    const ids = TEST_BOXES.map(b => `'${b.id}'`).join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM "Box" WHERE id IN (${ids})`);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return 400 if lat or lng is missing', async () => {
    const res = await request(app).get('/boxes/nearest?lat=50');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing lat or lng/);
  });

  it('should return 400 if lat or lng is invalid', async () => {
    const res = await request(app).get('/boxes/nearest?lat=abc&lng=xyz');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid lat or lng/);
  });

  it('should return 400 if radius is invalid', async () => {
    const res = await request(app).get('/boxes/nearest?lat=50&lng=14&radius=-10');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid radius/);
  });

  it('should return only the center box for a 50m radius', async () => {
    const res = await request(app).get('/boxes/nearest?lat=50.087&lng=14.421&radius=50');
    expect(res.status).toBe(200);
    const codes = res.body.map((b: any) => b.code);
    expect(codes).toContain('TEST1');
    expect(codes).not.toContain('TEST2');
    expect(codes).not.toContain('TEST3');
  });

  it('should return center and nearby boxes for a 60m radius', async () => {
    const res = await request(app).get('/boxes/nearest?lat=50.087&lng=14.421&radius=60');
    expect(res.status).toBe(200);
    const codes = res.body.map((b: any) => b.code);
    expect(codes).toContain('TEST1');
    expect(codes).toContain('TEST2');
    expect(codes).not.toContain('TEST3');
  });

  it('should return all boxes for a 600m radius', async () => {
    const res = await request(app).get('/boxes/nearest?lat=50.087&lng=14.421&radius=600');
    expect(res.status).toBe(200);
    const codes = res.body.map((b: any) => b.code);
    expect(codes).toContain('TEST1');
    expect(codes).toContain('TEST2');
    expect(codes).toContain('TEST3');
  });

  it('should return boxes sorted by distance', async () => {
    const res = await request(app).get('/boxes/nearest?lat=50.087&lng=14.421&radius=600');
    expect(res.status).toBe(200);
    const codes = res.body.map((b: any) => b.code);
    // Should be sorted: TEST1 (center), TEST2 (nearby), TEST3 (far)
    expect(codes.indexOf('TEST1')).toBeLessThan(codes.indexOf('TEST2'));
    expect(codes.indexOf('TEST2')).toBeLessThan(codes.indexOf('TEST3'));
  });
}); 