import express from 'express';
import {
  createQRISPayment,
  checkQRISPaymentStatus,
  handleQRISWebhook,
  confirmManualPayment,
  simulatePaymentSuccess,
  getPaymentHistory,
  debugBookingStatus
} from '../controllers/qris-payment.controller';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Webhook endpoint (no auth required - Xendit calls this)
router.post('/webhook', handleQRISWebhook);

// Public endpoint for payment simulation (test mode only)
router.post('/simulate/:booking_id', simulatePaymentSuccess);

// Create QRIS payment for a booking (optional auth)
router.post('/create', optionalAuthenticateToken, createQRISPayment);

// Check payment status (optional auth)
router.get('/status/:booking_id', optionalAuthenticateToken, checkQRISPaymentStatus);

// Debug endpoint (no auth required)
router.get('/debug/:booking_id', debugBookingStatus);

// Protected routes (require authentication)
router.use(authenticateToken);

// Manual confirmation by homestay owner
router.post('/confirm/:booking_id', confirmManualPayment);

// Get payment history
router.get('/history/:booking_id', getPaymentHistory);

export default router; 