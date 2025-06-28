import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { authConfig } from '../config/auth';

const router = express.Router();

// Store state parameters temporarily (in production this would be in Redis/DB)
const states = new Set<string>();

interface AuthCallbackQuery {
  code?: string;
  state?: string;
}

// GET /auth/login - Initiate OAuth flow
router.route('/login')
  .get((req: Request, res: Response) => {
    // Generate state parameter to prevent CSRF
    const state = uuidv4();
    states.add(state);

    // Build authorization URL
    const authUrl = new URL(authConfig.oauth.authorizationUrl || '');
    authUrl.searchParams.set('client_id', authConfig.oauth.clientId || '');
    authUrl.searchParams.set('redirect_uri', authConfig.oauth.callbackUrl || '');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    // Redirect to SSO provider
    res.redirect(authUrl.toString());
  });

// GET /auth/callback - Handle OAuth callback
router.route('/callback')
  .get(async (req: Request<{}, {}, {}, AuthCallbackQuery>, res: Response): Promise<void> => {
    const { code, state } = req.query;

    // Validate state parameter
    if (!state || !states.has(state)) {
      res.status(400).json({ message: 'Invalid state parameter' });
      return;
    }
    states.delete(state);

    if (!code) {
      res.status(400).json({ message: 'Authorization code not provided' });
      return;
    }

    try {
      // Exchange code for token
      const response = await axios.post(authConfig.oauth.tokenUrl || '', {
        code,
        client_id: authConfig.oauth.clientId,
        client_secret: authConfig.oauth.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: authConfig.oauth.callbackUrl
      });

      // In a real app:
      // 1. Store the token in a secure session
      // 2. Redirect to the main application
      // For this demo, we'll just return the token
      res.json(response.data);
    } catch (error) {
      console.error('Token exchange failed:', error);
      res.status(500).json({ message: 'Failed to exchange authorization code for token' });
    }
  });

export default router; 