import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export const authConfig = {
  // JWT settings
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: '1h',
  
  // OAuth settings
  oauth: {
    // In production, these would be external SSO provider URLs
    authorizationUrl: isProd 
      ? process.env.SSO_AUTH_URL 
      : 'http://localhost:3000/mock-sso/login',
    tokenUrl: isProd 
      ? process.env.SSO_TOKEN_URL 
      : 'http://localhost:3000/mock-sso/token',
    callbackUrl: isProd
      ? process.env.SSO_CALLBACK_URL
      : 'http://localhost:3000/auth/callback',
    clientId: process.env.SSO_CLIENT_ID || 'mock-client-id',
    clientSecret: process.env.SSO_CLIENT_SECRET || 'mock-client-secret',
  }
}; 