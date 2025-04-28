import { Request, Response, NextFunction } from 'express';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Get user profile - To be implemented' });
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Update user profile - To be implemented' });
}; 