import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { PaymentCreateInput, PaymentUpdateInput } from '../types/payment.types';
import { AppError } from '../middleware/error.middleware';

export const createPayment = async (
  req: Request<{}, {}, PaymentCreateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { booking_id, amount, payment_method, transaction_id } = req.body;

    // Check if booking exists and is not already paid
    const [bookings] = await pool.query(
      `SELECT b.*, h.owner_id 
       FROM bookings b 
       JOIN homestays h ON b.homestay_id = h.id 
       WHERE b.id = ? AND b.status = 'CONFIRMED'`,
      [booking_id]
    );

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return next(new AppError('Booking not found or not confirmed', 404));
    }

    const booking = bookings[0];
    if (booking.total_price !== amount) {
      return next(new AppError('Payment amount does not match booking total', 400));
    }

    // Create payment record
    const [result] = await pool.query(
      `INSERT INTO payments (id, booking_id, amount, payment_method, transaction_id)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [booking_id, amount, payment_method, transaction_id]
    );

    const [newPayment] = await pool.query(
      'SELECT * FROM payments WHERE id = ?',
      [(result as any).insertId]
    );

    // Create initial transaction record
    await pool.query(
      `INSERT INTO payment_transactions (id, payment_id, amount, status, transaction_id)
       VALUES (UUID(), ?, ?, 'PENDING', ?)`,
      [(result as any).insertId, amount, transaction_id]
    );

    res.status(201).json({
      status: 'success',
      data: newPayment[0]
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatus = async (
  req: Request<{ id: string }, {}, PaymentUpdateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, transaction_id, payment_date } = req.body;

    // Check if payment exists
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );

    if (!Array.isArray(payments) || payments.length === 0) {
      return next(new AppError('Payment not found', 404));
    }

    const payment = payments[0];

    // Update payment status
    await pool.query(
      `UPDATE payments 
       SET status = ?, 
           transaction_id = COALESCE(?, transaction_id),
           payment_date = COALESCE(?, payment_date)
       WHERE id = ?`,
      [status, transaction_id, payment_date, id]
    );

    // Create new transaction record
    await pool.query(
      `INSERT INTO payment_transactions (id, payment_id, amount, status, transaction_id, payment_date)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [id, payment.amount, status, transaction_id, payment_date]
    );

    // If payment is completed, update booking status
    if (status === 'COMPLETED') {
      await pool.query(
        'UPDATE bookings SET status = ? WHERE id = ?',
        ['CONFIRMED', payment.booking_id]
      );
    }

    // Get updated payment
    const [updatedPayment] = await pool.query(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );

    res.json({
      status: 'success',
      data: updatedPayment[0]
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const [payments] = await pool.query(
      `SELECT p.*, b.check_in_date, b.check_out_date, h.name as homestay_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN homestays h ON b.homestay_id = h.id
       WHERE p.id = ?`,
      [id]
    );

    if (!Array.isArray(payments) || payments.length === 0) {
      return next(new AppError('Payment not found', 404));
    }

    // Get payment transactions
    const [transactions] = await pool.query(
      'SELECT * FROM payment_transactions WHERE payment_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({
      status: 'success',
      data: {
        ...payments[0],
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentsByBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { booking_id } = req.params;
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC',
      [booking_id]
    );

    res.json({
      status: 'success',
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentsByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user_id = req.user?.id;
    const [payments] = await pool.query(
      `SELECT p.*, b.check_in_date, b.check_out_date, h.name as homestay_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN homestays h ON b.homestay_id = h.id
       WHERE b.user_id = ?
       ORDER BY p.created_at DESC`,
      [user_id]
    );

    res.json({
      status: 'success',
      data: payments
    });
  } catch (error) {
    next(error);
  }
}; 