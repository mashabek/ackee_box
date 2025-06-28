import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Mock driver token (boxes require driver role)
const mockDriverToken = jwt.sign(
  { id: 'driver-123', email: 'driver@test.com', role: 'driver' },
  process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  { expiresIn: '1h' }
);

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

describe('Box Routes', () => {
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

  describe('GET /boxes/nearest', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/boxes/nearest?lat=50&lng=14');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should require driver role', async () => {
      const userToken = jwt.sign(
        { id: 'user-123', email: 'user@test.com', role: 'user' },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: '1h' }
      );
      
              const res = await request(app)
          .get('/boxes/nearest?lat=50&lng=14')
          .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Forbidden/);
    });

    it('should return 400 if lat or lng is missing', async () => {
      const res = await request(app)
        .get('/boxes/nearest?lat=50')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 400 if lat or lng is invalid', async () => {
      const res = await request(app)
        .get('/boxes/nearest?lat=abc&lng=xyz')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 400 if radius is invalid', async () => {
      const res = await request(app)
        .get('/boxes/nearest?lat=50&lng=14&radius=-10')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(400);
    });

    it('should return only the center box for a 50m radius', async () => {
      const res = await request(app)
        .get('/boxes/nearest?lat=50.087&lng=14.421&radius=50')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(200);
      const codes = res.body.map((b: any) => b.code);
      expect(codes).toContain('TEST1');
      expect(codes).not.toContain('TEST2');
      expect(codes).not.toContain('TEST3');
    });

    it('should return center and nearby boxes for a 60m radius', async () => {
      const res = await request(app)
        .get('/boxes/nearest?lat=50.087&lng=14.421&radius=60')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(200);
      const codes = res.body.map((b: any) => b.code);
      expect(codes).toContain('TEST1');
      expect(codes).toContain('TEST2');
      expect(codes).not.toContain('TEST3');
    });

    it('should return all boxes for a 600m radius', async () => {
      const res = await request(app)
        .get('/boxes/nearest?lat=50.087&lng=14.421&radius=600')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(200);
      const codes = res.body.map((b: any) => b.code);
      expect(codes).toContain('TEST1');
      expect(codes).toContain('TEST2');
      expect(codes).toContain('TEST3');
    });

    it('should return boxes sorted by distance', async () => {
      const res = await request(app)
        .get('/boxes/nearest?lat=50.087&lng=14.421&radius=600')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(200);
      const codes = res.body.map((b: any) => b.code);
      // Should be sorted: TEST1 (center), TEST2 (nearby), TEST3 (far)
      expect(codes.indexOf('TEST1')).toBeLessThan(codes.indexOf('TEST2'));
      expect(codes.indexOf('TEST2')).toBeLessThan(codes.indexOf('TEST3'));
    });
  });

  describe('GET /boxes/search', () => {
    it('should return 400 if code is missing', async () => {
      const res = await request(app)
        .get('/boxes/search')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 404 if box not found', async () => {
      const res = await request(app)
        .get('/boxes/search?code=NONEXISTENT')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(404);
    });

    it('should return box details for valid code', async () => {
      const res = await request(app)
        .get('/boxes/search?code=TEST1')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.code).toBe('TEST1');
      expect(res.body.name).toBe('Test Box 1');
      expect(res.body).toHaveProperty('location');
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('GET /boxes/:boxCode/compartments', () => {
    it('should return 404 for non-existent box', async () => {
      const res = await request(app)
        .get('/boxes/NONEXISTENT/compartments')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(404);
    });

    it('should return compartment information for valid box', async () => {
      const res = await request(app)
        .get('/boxes/TEST1/compartments')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('boxCode', 'TEST1');
      expect(res.body).toHaveProperty('availableCompartments');
      expect(res.body).toHaveProperty('compartments');
      expect(Array.isArray(res.body.compartments)).toBe(true);
    });
  });
}); 