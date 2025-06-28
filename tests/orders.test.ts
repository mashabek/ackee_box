import request from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';

// Mock auth tokens
const mockDriverToken = jwt.sign(
  { id: 'driver-123', email: 'driver@test.com', role: 'driver' },
  process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  { expiresIn: '1h' }
);

const mockUserToken = jwt.sign(
  { id: 'user-123', email: 'user@test.com', role: 'user' },
  process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  { expiresIn: '1h' }
);

const mockAdminToken = jwt.sign(
  { id: 'admin-123', email: 'admin@test.com', role: 'admin' },
  process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  { expiresIn: '1h' }
);

describe('Order Routes', () => {
  describe('GET /orders', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/orders');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should allow authenticated users to list orders', async () => {
      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${mockUserToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should allow drivers to list orders', async () => {
      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${mockDriverToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should allow admins to list orders', async () => {
      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${mockAdminToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter orders by status when provided', async () => {
      const res = await request(app)
        .get('/orders?status=pending')
        .set('Authorization', `Bearer ${mockUserToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .get('/orders?status=invalid_status')
        .set('Authorization', `Bearer ${mockUserToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status/);
    });

    it('should accept valid status values', async () => {
      const validStatuses = ['pending', 'in_transit', 'delivered', 'picked_up'];
      
      for (const status of validStatuses) {
        const res = await request(app)
          .get(`/orders?status=${status}`)
          .set('Authorization', `Bearer ${mockUserToken}`);
        
        expect(res.status).toBe(200);
      }
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .patch('/orders/1/status')
        .send({ status: 'delivered' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should validate order ID as integer', async () => {
      const res = await request(app)
        .patch('/orders/invalid_id/status')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({ status: 'delivered' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid order ID/);
    });

    it('should require status in request body', async () => {
      const res = await request(app)
        .patch('/orders/1/status')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({});
      
      expect(res.status).toBe(400);
    });

    it('should validate status value', async () => {
      const res = await request(app)
        .patch('/orders/1/status')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({ status: 'invalid_status' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status/);
    });

    it('should accept valid status updates', async () => {
      const validStatuses = ['pending', 'in_transit', 'delivered', 'picked_up'];
      
      for (const status of validStatuses) {
        const res = await request(app)
          .patch('/orders/1/status')
          .set('Authorization', `Bearer ${mockDriverToken}`)
          .send({ status });
        
        // May return 404 for non-existent order, but not validation error
        expect([200, 404]).toContain(res.status);
        
        if (res.status === 404) {
          expect(res.body.error).toMatch(/Order not found/);
        }
      }
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .patch('/orders/99999/status')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({ status: 'delivered' });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Order not found/);
    });
  });
}); 