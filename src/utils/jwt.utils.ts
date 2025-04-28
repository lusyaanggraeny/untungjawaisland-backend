import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/user.types';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || '', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;
}; 