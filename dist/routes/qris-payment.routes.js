"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const qris_payment_controller_1 = require("../controllers/qris-payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Webhook endpoint (no auth required - Xendit calls this)
router.post('/webhook', qris_payment_controller_1.handleQRISWebhook);
// Public endpoint for payment simulation (test mode only)
router.post('/simulate/:booking_id', qris_payment_controller_1.simulatePaymentSuccess);
// Create QRIS payment for a booking (optional auth)
router.post('/create', auth_middleware_1.optionalAuthenticateToken, qris_payment_controller_1.createQRISPayment);
// Check payment status (optional auth)
router.get('/status/:booking_id', auth_middleware_1.optionalAuthenticateToken, qris_payment_controller_1.checkQRISPaymentStatus);
// Debug endpoint (no auth required)
router.get('/debug/:booking_id', qris_payment_controller_1.debugBookingStatus);
// Protected routes (require authentication)
router.use(auth_middleware_1.authenticateToken);
// Manual confirmation by homestay owner
router.post('/confirm/:booking_id', qris_payment_controller_1.confirmManualPayment);
// Get payment history
router.get('/history/:booking_id', qris_payment_controller_1.getPaymentHistory);
exports.default = router;
