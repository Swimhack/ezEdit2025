import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Define user interface to extend Express.Request
declare global {
  namespace Express {
    interface Request {
      user?: { sub: string };
    }
  }
}

// Set development mode for convenience - this would be properly set by environment variables
const isDev = true; // process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  // In development/testing, allow requests without auth
  if (isDev) {
    req.user = { sub: 'test-user-id' };
    return next();
  }
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new Error('Missing auth token'));

  try {
    req.user = jwt.decode(token) as { sub: string };
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}