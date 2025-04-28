import express from 'express';
import {
  createPayment,
  updatePaymentStatus,
  getPaymentById,
  getPaymentsByBooking,
  getPaymentsByUser
} from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new payment
router.post('/', createPayment);

// Update payment status
router.patch('/:id/status', updatePaymentStatus);

// Get payment by ID
router.get('/:id', getPaymentById);

// Get payments by booking
router.get('/booking/:booking_id', getPaymentsByBooking);

// Get user's payments
router.get('/user/payments', getPaymentsByUser);

export default router; 