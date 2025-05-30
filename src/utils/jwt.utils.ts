import jwt, { SignOptions } from 'jsonwebtoken';
import { AdminJwtPayload, UserJwtPayload } from '../types/user.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload: AdminJwtPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

// JWT payload for landing page users
export const generateUserToken = (payload: UserJwtPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN
  };
  return jwt.sign(
    { ...payload, user_type: 'landing_user' }, // Add a type to distinguish from admin tokens
    JWT_SECRET,
    options
  );
};

export const verifyToken = (token: string): AdminJwtPayload | UserJwtPayload => {
  return jwt.verify(token, JWT_SECRET) as AdminJwtPayload | UserJwtPayload;
}; 