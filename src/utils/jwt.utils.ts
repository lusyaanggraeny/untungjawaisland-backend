import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/user.types';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// JWT payload for landing page users
interface UserJwtPayload {
  id: number;
  email: string;
  type: string;
}

export const generateUserToken = (payload: UserJwtPayload): string => {
  return jwt.sign(
    { ...payload, user_type: 'landing_user' }, // Add a type to distinguish from admin tokens
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;
}; 