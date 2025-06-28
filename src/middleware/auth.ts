import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = jwt.verify(token, authConfig.jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
    return;
  }
}; 