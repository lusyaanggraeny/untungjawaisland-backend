"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
// Admin routes - GET all payments
router.get('/', payment_controller_1.getAllPayments); // Get all payments (admin)
// Get user's payments
router.get('/user/payments', payment_controller_1.getPaymentsByUser);
// Get payments by booking
router.get('/booking/:booking_id', payment_controller_1.getPaymentsByBooking);
// Get payment by ID
router.get('/:id', payment_controller_1.getPaymentById);
// Create a new payment
router.post('/', payment_controller_1.createPayment);
// Update payment status
router.patch('/:id/status', payment_controller_1.updatePaymentStatus);
exports.default = router;
