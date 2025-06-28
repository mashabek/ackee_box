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

describe('Delivery Routes', () => {
  describe('POST /deliveries/reserve', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/deliveries/reserve')
        .send({
          boxCode: 'TEST123',
          orderId: 1
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should require driver role', async () => {
      const res = await request(app)
        .post('/deliveries/reserve')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send({
          boxCode: 'TEST123',
          orderId: 1
        });
      
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/deliveries/reserve')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Missing required fields|boxCode|orderId/);
    });

    it('should validate boxCode and orderId types', async () => {
      const res = await request(app)
        .post('/deliveries/reserve')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({
          boxCode: 123, // should be string
          orderId: 'invalid' // should be number
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /deliveries/start', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/deliveries/start')
        .send({ orderId: 1 });
      
      expect(res.status).toBe(401);
    });

    it('should require driver role', async () => {
      const res = await request(app)
        .post('/deliveries/start')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send({ orderId: 1 });
      
      expect(res.status).toBe(403);
    });

    it('should validate required orderId', async () => {
      const res = await request(app)
        .post('/deliveries/start')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/orderId/);
    });

    it('should accept orderId with optional boxCode', async () => {
      const res = await request(app)
        .post('/deliveries/start')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({
          orderId: 1,
          boxCode: 'TEST123'
        });
      
      // Expect 400/404/409 due to non-existent order/box or business logic in test
      expect([400, 404, 409]).toContain(res.status);
    });
  });

  describe('POST /deliveries/complete', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/deliveries/complete')
        .send({ orderId: 1 });
      
      expect(res.status).toBe(401);
    });

    it('should require driver role', async () => {
      const res = await request(app)
        .post('/deliveries/complete')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send({ orderId: 1 });
      
      expect(res.status).toBe(403);
    });

    it('should validate required orderId', async () => {
      const res = await request(app)
        .post('/deliveries/complete')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/orderId/);
    });
  });

  describe('POST /deliveries/test-notification', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/deliveries/test-notification')
        .send({
          orderId: 1,
          customerId: 'customer-123',
          boxCode: 'TEST123'
        });
      
      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/deliveries/test-notification')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/orderId|customerId|boxCode/);
    });

    it('should accept valid notification data', async () => {
      const res = await request(app)
        .post('/deliveries/test-notification')
        .set('Authorization', `Bearer ${mockDriverToken}`)
        .send({
          orderId: 1,
          customerId: 'customer-123',
          boxCode: 'TEST123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/notification queued/);
    });
  });
});

describe('Delivery Workflow Integration', () => {
  it('should simulate complete delivery workflow steps', async () => {
    console.log('📝 Testing delivery workflow simulation...');
    
    // Step 1: Driver reserves compartment (would fail due to no test data)
    const reserveRes = await request(app)
      .post('/deliveries/reserve')
      .set('Authorization', `Bearer ${mockDriverToken}`)
      .send({
        boxCode: 'TEST123',
        orderId: 1
      });
    
    // Expect 400/404 due to missing test data, not auth/validation errors
    expect([400, 404, 409]).toContain(reserveRes.status);
    
    // Step 2: Driver starts delivery (would fail due to no test data)
    const startRes = await request(app)
      .post('/deliveries/start')
      .set('Authorization', `Bearer ${mockDriverToken}`)
      .send({
        orderId: 1,
        boxCode: 'TEST123'
      });
    
    expect([400, 404, 409]).toContain(startRes.status);
    
    // Step 3: Driver completes delivery (would fail due to no test data)
    const completeRes = await request(app)
      .post('/deliveries/complete')
      .set('Authorization', `Bearer ${mockDriverToken}`)
      .send({
        orderId: 1
      });
    
    expect([400, 404, 409]).toContain(completeRes.status);
    
    console.log('✅ Workflow simulation completed - all endpoints reachable with proper auth');
  });
}); 