import express from 'express';
import {
  createPayment,
  updatePaymentStatus,
  getPaymentById,
  getPaymentsByBooking,
  getPaymentsByUser,
  getAllPayments
} from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin routes - GET all payments
router.get('/', getAllPayments); // Get all payments (admin)

// NOTE: Manual payment confirmation (by admin/owner) is handled in a separate system, not in this codebase.

// Get user's payments
router.get('/user/payments', getPaymentsByUser);

// Get payments by booking
router.get('/booking/:booking_id', getPaymentsByBooking);

// Get payment by ID
router.get('/:id', getPaymentById);

// Create a new payment
router.post('/', createPayment);

// Update payment status
router.patch('/:id/status', updatePaymentStatus);

export default router; 