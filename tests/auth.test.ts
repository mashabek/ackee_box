import request from 'supertest';
import app from '../src/index';
import axios from 'axios';

// Mock axios to prevent real HTTP requests during testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /auth/login', () => {
    it('should redirect to OAuth authorization URL', async () => {
      const res = await request(app).get('/auth/login');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBeDefined();
      
      // Check that the redirect URL contains expected OAuth parameters
      const redirectUrl = new URL(res.headers.location);
      expect(redirectUrl.searchParams.has('client_id')).toBe(true);
      expect(redirectUrl.searchParams.has('redirect_uri')).toBe(true);
      expect(redirectUrl.searchParams.has('state')).toBe(true);
      expect(redirectUrl.searchParams.get('response_type')).toBe('code');
    });

    it('should generate unique state parameter for each request', async () => {
      const res1 = await request(app).get('/auth/login');
      const res2 = await request(app).get('/auth/login');
      
      expect(res1.status).toBe(302);
      expect(res2.status).toBe(302);
      
      const url1 = new URL(res1.headers.location);
      const url2 = new URL(res2.headers.location);
      
      const state1 = url1.searchParams.get('state');
      const state2 = url2.searchParams.get('state');
      
      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state1).not.toBe(state2);
    });

    it('should include proper OAuth parameters', async () => {
      const res = await request(app).get('/auth/login');
      
      expect(res.status).toBe(302);
      
      const redirectUrl = new URL(res.headers.location);
      expect(redirectUrl.searchParams.get('client_id')).toBe('mock-client-id');
      expect(redirectUrl.searchParams.get('response_type')).toBe('code');
      expect(redirectUrl.searchParams.get('redirect_uri')).toContain('/auth/callback');
    });
  });

  describe('GET /auth/callback', () => {
    it('should return 400 when state parameter is missing', async () => {
      const res = await request(app)
        .get('/auth/callback')
        .query({ code: 'test-code' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid state parameter/);
    });

    it('should return 400 when state parameter is invalid', async () => {
      const res = await request(app)
        .get('/auth/callback')
        .query({ 
          code: 'test-code',
          state: 'invalid-state'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid state parameter/);
    });

    it('should return 400 when authorization code is missing', async () => {
      // First, get a valid state by initiating login
      const loginRes = await request(app).get('/auth/login');
      const redirectUrl = new URL(loginRes.headers.location);
      const state = redirectUrl.searchParams.get('state');
      
      const res = await request(app)
        .get('/auth/callback')
        .query({ state });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Authorization code not provided/);
    });

    it('should consume state parameter (use only once)', async () => {
      // Get a valid state
      const loginRes = await request(app).get('/auth/login');
      const redirectUrl = new URL(loginRes.headers.location);
      const state = redirectUrl.searchParams.get('state');
      
      // Mock successful token exchange
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'test-token', token_type: 'Bearer' }
      });
      
      // Use the state once
      const res1 = await request(app)
        .get('/auth/callback')
        .query({ 
          code: 'test-code-1',
          state 
        });
      
      expect(res1.status).toBe(200);
      
      // Try to use the same state again - should fail with invalid state
      const res2 = await request(app)
        .get('/auth/callback')
        .query({ 
          code: 'test-code-2',
          state 
        });
      
      expect(res2.status).toBe(400);
      expect(res2.body.message).toMatch(/Invalid state parameter/);
    });

    it('should handle successful token exchange', async () => {
      // Get a valid state
      const loginRes = await request(app).get('/auth/login');
      const redirectUrl = new URL(loginRes.headers.location);
      const state = redirectUrl.searchParams.get('state');
      
      // Mock successful token response
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      };
      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });
      
      const res = await request(app)
        .get('/auth/callback')
        .query({ 
          code: 'valid-auth-code',
          state 
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockTokenResponse);
      
      // Verify axios was called with correct parameters
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/mock-sso/token',
        {
          code: 'valid-auth-code',
          client_id: 'mock-client-id',
          client_secret: 'mock-client-secret',
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:3000/auth/callback'
        }
      );
    });

    it('should handle token exchange failure', async () => {
      // Get a valid state
      const loginRes = await request(app).get('/auth/login');
      const redirectUrl = new URL(loginRes.headers.location);
      const state = redirectUrl.searchParams.get('state');
      
      // Mock failed token response
      mockedAxios.post.mockRejectedValueOnce(new Error('Token exchange failed'));
      
      // Suppress console.error for this test since we expect an error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const res = await request(app)
        .get('/auth/callback')
        .query({ 
          code: 'invalid-auth-code',
          state 
        });
      
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Failed to exchange authorization code for token/);
      
      // Verify the error was logged (even though we suppressed it)
      expect(consoleSpy).toHaveBeenCalledWith('Token exchange failed:', expect.any(Error));
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('OAuth Security Features', () => {
    it('should implement CSRF protection via state parameter', async () => {
      // 1. Login should generate state
      const loginRes = await request(app).get('/auth/login');
      expect(loginRes.status).toBe(302);
      
      const redirectUrl = new URL(loginRes.headers.location);
      const state = redirectUrl.searchParams.get('state');
      expect(state).toBeDefined();
      expect(state?.length).toBeGreaterThan(10); // Should be a substantial random string
      
      // 2. Callback without state should fail
      const noStateRes = await request(app)
        .get('/auth/callback')
        .query({ code: 'test-code' });
      expect(noStateRes.status).toBe(400);
      
      // 3. Callback with wrong state should fail
      const wrongStateRes = await request(app)
        .get('/auth/callback')
        .query({ code: 'test-code', state: 'wrong-state' });
      expect(wrongStateRes.status).toBe(400);
    });

    it('should validate OAuth flow parameters', async () => {
      const loginRes = await request(app).get('/auth/login');
      const redirectUrl = new URL(loginRes.headers.location);
      
      // Verify all required OAuth parameters are present
      expect(redirectUrl.searchParams.get('client_id')).toBe('mock-client-id');
      expect(redirectUrl.searchParams.get('response_type')).toBe('code');
      expect(redirectUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/auth/callback');
      expect(redirectUrl.searchParams.get('state')).toBeTruthy();
    });

    it('should use proper grant_type in token exchange', async () => {
      // Get a valid state
      const loginRes = await request(app).get('/auth/login');
      const redirectUrl = new URL(loginRes.headers.location);
      const state = redirectUrl.searchParams.get('state');
      
      // Mock token response
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'test-token' }
      });
      
      await request(app)
        .get('/auth/callback')
        .query({ 
          code: 'test-code',
          state 
        });
      
      // Verify correct grant_type was used
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          grant_type: 'authorization_code'
        })
      );
    });
  });
}); 