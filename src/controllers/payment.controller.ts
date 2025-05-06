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
    const { rows: bookings } = await pool.query(
      `SELECT b.*, h.owner_id 
       FROM bookings b 
       JOIN homestays h ON b.homestay_id = h.id 
       WHERE b.id = $1 AND b.status = 'CONFIRMED'`,
      [booking_id]
    );

    if (bookings.length === 0) {
      return next(new AppError('Booking not found or not confirmed', 404));
    }

    const booking = bookings[0];
    if (booking.total_price !== amount) {
      return next(new AppError('Payment amount does not match booking total', 400));
    }

    // Create payment record
    const { rows: [newPayment] } = await pool.query(
      `INSERT INTO payments (booking_id, amount, payment_method, transaction_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [booking_id, amount, payment_method, transaction_id]
    );

    // Create initial transaction record
    await pool.query(
      `INSERT INTO payment_transactions (payment_id, amount, status, transaction_id)
       VALUES ($1, $2, 'PENDING', $3)`,
      [newPayment.id, amount, transaction_id]
    );

    res.status(201).json({
      status: 'success',
      data: newPayment
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
    const { rows: payments } = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );

    if (payments.length === 0) {
      return next(new AppError('Payment not found', 404));
    }

    const payment = payments[0];

    // Update payment status
    const { rows: [updatedPayment] } = await pool.query(
      `UPDATE payments 
       SET status = $1, 
           transaction_id = COALESCE($2, transaction_id),
           payment_date = COALESCE($3, payment_date)
       WHERE id = $4
       RETURNING *`,
      [status, transaction_id, payment_date, id]
    );

    // Create new transaction record
    await pool.query(
      `INSERT INTO payment_transactions (payment_id, amount, status, transaction_id, payment_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, payment.amount, status, transaction_id, payment_date]
    );

    // If payment is completed, update booking status
    if (status === 'COMPLETED') {
      await pool.query(
        'UPDATE bookings SET status = $1 WHERE id = $2',
        ['CONFIRMED', payment.booking_id]
      );
    }

    res.json({
      status: 'success',
      data: updatedPayment
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rows: payments } = await pool.query(
      `SELECT p.*, b.check_in_date, b.check_out_date, h.name as homestay_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN homestays h ON b.homestay_id = h.id
       WHERE p.id = $1`,
      [id]
    );

    if (payments.length === 0) {
      return next(new AppError('Payment not found', 404));
    }

    // Get payment transactions
    const { rows: transactions } = await pool.query(
      'SELECT * FROM payment_transactions WHERE payment_id = $1 ORDER BY created_at DESC',
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
    const { rows: payments } = await pool.query(
      'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC',
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
    const { rows: payments } = await pool.query(
      `SELECT p.*, b.check_in_date, b.check_out_date, h.name as homestay_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN homestays h ON b.homestay_id = h.id
       WHERE b.user_id = $1
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