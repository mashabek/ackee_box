import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authConfig } from '../config/auth';

const router = express.Router();

// Store auth codes temporarily (in production this would be in Redis/DB)
const authCodes = new Map<string, { email: string; state: string }>();

// Mock login form HTML
const loginFormHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Mock SSO Login</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 40px auto; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; }
    input { width: 100%; padding: 8px; margin-bottom: 10px; }
    button { background: #4CAF50; color: white; padding: 10px 15px; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <h2>Mock SSO Login</h2>
  <form action="/mock-sso/login" method="POST">
    <input type="hidden" name="state" value="{{state}}">
    <div class="form-group">
      <label>Email:</label>
      <input type="email" name="email" required>
    </div>
    <div class="form-group">
      <label>Password:</label>
      <input type="password" name="password" required>
    </div>
    <div class="form-group">
      <label>2FA Code:</label>
      <input type="text" name="twoFactorCode" required>
    </div>
    <button type="submit">Login</button>
  </form>
</body>
</html>
`;

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
    twoFactorCode: string;
    state?: string;
  }
}

interface TokenRequest extends Request {
  body: {
    code: string;
    client_id: string;
    client_secret: string;
  }
}

// GET /mock-sso/login - Show login form
router.route('/login')
  .get((req: Request, res: Response) => {
    const state = req.query.state as string;
    const html = loginFormHtml.replace('{{state}}', state || '');
    res.send(html);
  })
  .post((req: LoginRequest, res: Response) => {
    const { email, password, twoFactorCode, state } = req.body;

    // In a real system, validate credentials and 2FA
    // For mock, just check if values are provided
    if (!email || !password || !twoFactorCode) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Generate auth code
    const code = uuidv4();
    authCodes.set(code, { email, state: state || '' });

    // Redirect back to the application with the auth code
    const redirectUrl = new URL(authConfig.oauth.callbackUrl || '');
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', state);
    
    res.redirect(redirectUrl.toString());
  });

// POST /mock-sso/token - Exchange auth code for token
router.post('/token', (req: TokenRequest, res: Response) => {
  const { code, client_id, client_secret } = req.body;

  // Validate client credentials
  if (client_id !== authConfig.oauth.clientId || 
      client_secret !== authConfig.oauth.clientSecret) {
    res.status(401).json({ message: 'Invalid client credentials' });
    return;
  }

  // Validate and consume auth code
  const authData = authCodes.get(code);
  if (!authData) {
    res.status(400).json({ message: 'Invalid or expired code' });
    return;
  }
  authCodes.delete(code);

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: uuidv4(),
      email: authData.email,
      role: 'driver' // Mock role for demo
    },
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiresIn } as SignOptions
  );

  res.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 3600
  });
});

// POST /mock-sso/test-token - Simple test token generation (for testing only)
router.post('/test-token', (req: Request, res: Response) => {
  // Generate JWT token directly with default driver credentials
  const token = jwt.sign(
    { 
      id: uuidv4(),
      email: 'driver1@example.com',
      role: 'driver'
    },
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiresIn } as SignOptions
  );

  res.json({
    token: token,
    user: {
      id: uuidv4(),
      email: 'driver1@example.com',
      role: 'driver'
    }
  });
});

export default router; 