"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugBookingStatus = exports.getPaymentHistory = exports.simulatePaymentSuccess = exports.confirmManualPayment = exports.handleQRISWebhook = exports.checkQRISPaymentStatus = exports.createQRISPayment = void 0;
const qris_service_1 = require("../services/qris.service");
const error_middleware_1 = require("../middleware/error.middleware");
const database_1 = require("../config/database");
const xendit_config_1 = require("../config/xendit.config");
const xendit_config_2 = require("../config/xendit.config");
/**
 * Create QRIS payment for a booking
 * POST /api/payments/qris/create
 */
const createQRISPayment = async (req, res, next) => {
    try {
        console.log('🔍 CREATE QRIS PAYMENT - Starting...');
        const { booking_id, customer_name, customer_email } = req.body;
        console.log('📥 Request body:', { booking_id, customer_name, customer_email });
        if (!booking_id) {
            console.log('❌ No booking_id provided');
            return next(new error_middleware_1.AppError('Booking ID is required', 400));
        }
        // Get booking details
        const { rows: bookings } = await database_1.pool.query('SELECT * FROM "booking" WHERE id = $1', [booking_id]);
        if (bookings.length === 0) {
            return next(new error_middleware_1.AppError('Booking not found', 404));
        }
        const booking = bookings[0];
        // Check if payment already exists for this booking
        const { rows: existingPayments } = await database_1.pool.query('SELECT * FROM payments WHERE booking_id = $1 AND payment_status = $2', [booking_id, 'PENDING']);
        if (existingPayments.length > 0) {
            return next(new error_middleware_1.AppError('Payment already exists for this booking', 400));
        }
        // Create QRIS payment
        console.log('🔧 Calling QRIS service with:', {
            booking_id: booking_id.toString(),
            amount: booking.total_price
        });
        const qrisPayment = await qris_service_1.qrisService.createQRISPayment({
            booking_id: booking_id.toString(),
            amount: booking.total_price,
            customer_name,
            customer_email,
            description: `Pembayaran homestay - Booking ${booking.booking_number}`
        });
        console.log('✅ QRIS service returned:', qrisPayment);
        res.status(201).json({
            status: 'success',
            data: {
                id: Date.now(), // Generate a unique ID for this payment
                booking_id: booking_id,
                amount: qrisPayment.amount,
                qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrisPayment.qr_code)}`,
                payment_status: 'PENDING',
                expires_at: qrisPayment.expires_at,
                is_test_mode: qrisPayment.is_test_mode,
                xendit_invoice_id: qrisPayment.qr_id,
                instructions: {
                    id: 'Scan QR code dengan aplikasi mobile banking atau e-wallet Anda',
                    en: 'Scan QR code with your mobile banking or e-wallet app'
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createQRISPayment = createQRISPayment;
/**
 * Check QRIS payment status
 * GET /api/payments/qris/status/:booking_id
 */
const checkQRISPaymentStatus = async (req, res, next) => {
    try {
        console.log('🔍 [STATUS CHECK] Starting for booking:', req.params.booking_id);
        const { booking_id } = req.params;
        // Get payment from database
        console.log('🔍 [STATUS CHECK] Querying database for booking_id:', booking_id);
        const { rows: payments } = await database_1.pool.query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1', [booking_id]);
        console.log('🔍 [STATUS CHECK] Found payments:', payments.length);
        if (payments.length === 0) {
            console.log('❌ [STATUS CHECK] No payment found for booking:', booking_id);
            return next(new error_middleware_1.AppError('Payment not found for this booking', 404));
        }
        const payment = payments[0];
        console.log('🔍 [STATUS CHECK] Payment status:', payment.payment_status, 'ID:', payment.id);
        // If payment is already completed, return status
        if (payment.payment_status === 'COMPLETED') {
            const completedResponseData = {
                status: 'success',
                data: {
                    payment_status: 'COMPLETED',
                    payment_completed_at: payment.payment_date,
                    booking_status: 'confirmed'
                }
            };
            console.log('✅ [STATUS CHECK] Payment completed, returning response for booking:', booking_id, 'Response:', JSON.stringify(completedResponseData));
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json(completedResponseData);
        }
        // Check status from Xendit if still pending and has transaction ID
        if (payment.transaction_id && payment.payment_status === 'PENDING') {
            try {
                const xenditStatus = await qris_service_1.qrisService.checkPaymentStatus(payment.transaction_id);
                console.log('🔍 Xendit status check:', xenditStatus);
            }
            catch (error) {
                console.log('⚠️ Could not check Xendit status, using database status');
            }
        }
        // Return current payment status from database
        const responseData = {
            status: 'success',
            data: {
                payment_status: payment.payment_status,
                payment_completed_at: payment.payment_date,
                booking_status: payment.payment_status === 'COMPLETED' ? 'confirmed' : 'pending'
            }
        };
        console.log('✅ [STATUS CHECK] Returning response for booking:', booking_id, 'Response:', JSON.stringify(responseData));
        // Add explicit headers to help with any CORS/browser issues
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(responseData);
    }
    catch (error) {
        console.error('❌ [STATUS CHECK] Error for booking:', req.params.booking_id, 'Error:', error);
        next(error);
    }
};
exports.checkQRISPaymentStatus = checkQRISPaymentStatus;
/**
 * Xendit webhook handler for QRIS payments
 * POST /api/payments/webhook/qris
 */
const handleQRISWebhook = async (req, res, next) => {
    try {
        console.log('📧 Received QRIS webhook:', req.body);
        // TODO: Verify webhook signature for security
        // const signature = req.headers['x-callback-token'];
        const webhookData = req.body;
        // Process the webhook
        await qris_service_1.qrisService.processWebhook(webhookData);
        res.status(200).json({
            status: 'success',
            message: 'Webhook processed successfully'
        });
    }
    catch (error) {
        console.error('❌ Webhook processing error:', error);
        next(error);
    }
};
exports.handleQRISWebhook = handleQRISWebhook;
/**
 * Manual payment confirmation for homestay owners
 * POST /api/payments/qris/confirm/:booking_id
 */
const confirmManualPayment = async (req, res, next) => {
    try {
        const { booking_id } = req.params;
        const { owner_confirmation } = req.body;
        if (owner_confirmation !== true) {
            return next(new error_middleware_1.AppError('Owner confirmation is required', 400));
        }
        // Check if payment exists and is completed
        const { rows: payments } = await database_1.pool.query('SELECT * FROM payments WHERE booking_id = $1 AND payment_status = $2', [booking_id, 'COMPLETED']);
        if (payments.length === 0) {
            return next(new error_middleware_1.AppError('Payment not found or not completed', 404));
        }
        // Update booking to confirmed status (manual confirmation by owner)
        await database_1.pool.query('UPDATE "booking" SET status = $1, confirmed_at = CURRENT_TIMESTAMP WHERE id = $2', ['confirmed', booking_id]);
        // Update payment to indicate manual confirmation
        await database_1.pool.query('UPDATE payments SET manual_confirmation_required = $1 WHERE booking_id = $2', [false, booking_id]);
        res.json({
            status: 'success',
            message: 'Booking confirmed by homestay owner',
            data: {
                booking_id,
                status: 'CONFIRMED',
                confirmed_at: new Date().toISOString()
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.confirmManualPayment = confirmManualPayment;
/**
 * Simulate payment success (TEST MODE ONLY)
 * POST /api/payments/qris/simulate/:booking_id
 */
const simulatePaymentSuccess = async (req, res, next) => {
    try {
        if (!(0, xendit_config_1.isTestMode)()) {
            return next(new error_middleware_1.AppError('Payment simulation only available in test mode', 403));
        }
        const { booking_id } = req.params;
        await qris_service_1.qrisService.simulatePaymentSuccess(booking_id);
        res.json({
            status: 'success',
            data: {
                payment_status: 'COMPLETED',
                payment_completed_at: new Date().toISOString(),
                booking_status: 'confirmed'
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.simulatePaymentSuccess = simulatePaymentSuccess;
/**
 * Get payment history for a booking
 * GET /api/payments/qris/history/:booking_id
 */
const getPaymentHistory = async (req, res, next) => {
    try {
        const { booking_id } = req.params;
        const { rows: payments } = await database_1.pool.query(`SELECT 
         p.*,
         b.booking_number,
         b.status as booking_status
       FROM payments p
       JOIN "booking" b ON p.booking_id = b.id
       WHERE p.booking_id = $1
       ORDER BY p.created_at DESC`, [booking_id]);
        res.json({
            status: 'success',
            data: payments
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentHistory = getPaymentHistory;
/**
 * Diagnostic endpoint to check booking and payment status
 * GET /api/qris/debug/:booking_id
 */
const debugBookingStatus = async (req, res, next) => {
    try {
        const { booking_id } = req.params;
        // Check if booking exists
        const { rows: bookings } = await database_1.pool.query('SELECT * FROM "booking" WHERE id = $1', [booking_id]);
        if (bookings.length === 0) {
            return res.json({
                status: 'debug',
                booking_found: false,
                message: 'Booking not found'
            });
        }
        const booking = bookings[0];
        // Check existing payments
        const { rows: payments } = await database_1.pool.query('SELECT * FROM payments WHERE booking_id = $1', [booking_id]);
        // Check table structure
        const { rows: columns } = await database_1.pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `);
        res.json({
            status: 'debug',
            booking_found: true,
            booking: {
                id: booking.id,
                status: booking.status,
                total_price: booking.total_price,
                user_id: booking.user_id,
                room_id: booking.room_id,
                booking_number: booking.booking_number
            },
            existing_payments: payments,
            payments_table_columns: columns.map(col => `${col.column_name}: ${col.data_type}`),
            xendit_config: {
                is_test_mode: (0, xendit_config_1.isTestMode)(),
                secret_key_type: xendit_config_2.xenditConfig.secretKey.includes('development') ? 'test' : 'production'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'debug_error',
            message: error.message,
            stack: error.stack
        });
    }
};
exports.debugBookingStatus = debugBookingStatus;
