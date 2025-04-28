import { Request, Response, NextFunction } from 'express';

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Create booking - To be implemented' });
};

export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Get booking by id - To be implemented' });
};

export const getUserBookings = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Get user bookings - To be implemented' });
};

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Update booking status - To be implemented' });
}; 