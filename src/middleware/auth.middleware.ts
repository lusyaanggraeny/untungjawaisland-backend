import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

// Extended JWT payload interface to handle both admin and landing page user tokens
interface JwtPayload {
  id: number;
  role?: string;
  email?: string;
  type?: string;
  user_type?: 'admin' | 'landing_user';
  exp?: number; // JWT expiration timestamp
  iat?: number; // JWT issued at timestamp
}

// Update the global Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('🔐 [AUTH DEBUG] Auth middleware triggered for:', req.method, req.path);
  console.log('🔐 [AUTH DEBUG] Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 [AUTH DEBUG] Extracted token:', token ? `${token.substring(0, 20)}...` : 'None');

  if (!token) {
    console.log('❌ [AUTH DEBUG] No token provided');
    return next(new AppError('No token provided', 401));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    ) as JwtPayload;
    
    console.log('✅ [AUTH DEBUG] JWT verification successful');
    console.log('🔐 [AUTH DEBUG] Token payload:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type,
      user_type: decoded.user_type,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiration'
    });
    
    req.user = decoded;
    console.log('✅ [AUTH DEBUG] User attached to request:', decoded.id);
    next();
  } catch (error) {
    console.log('❌ [AUTH DEBUG] JWT verification failed:', error.message);
    console.log('❌ [AUTH DEBUG] JWT error details:', error);
    return next(new AppError('Invalid token', 401));
  }
};

export const optionalAuthenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without user info
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    // Invalid token, continue without user info
    req.user = undefined;
    next();
  }
}; 