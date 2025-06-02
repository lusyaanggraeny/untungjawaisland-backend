"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPayments = exports.getPaymentsByUser = exports.getPaymentsByBooking = exports.getPaymentById = exports.updatePaymentStatus = exports.createPayment = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const createPayment = async (req, res, next) => {
    try {
        const { booking_id, amount, payment_method, transaction_id } = req.body;
        // Check if booking exists and is not already paid
        const { rows: bookings } = await database_1.pool.query(`SELECT b.*, h.owner_id 
       FROM bookings b 
       JOIN homestays h ON b.homestay_id = h.id 
       WHERE b.id = $1 AND b.status = 'CONFIRMED'`, [booking_id]);
        if (bookings.length === 0) {
            return next(new error_middleware_1.AppError('Booking not found or not confirmed', 404));
        }
        const booking = bookings[0];
        if (booking.total_price !== amount) {
            return next(new error_middleware_1.AppError('Payment amount does not match booking total', 400));
        }
        // Create payment record
        const { rows: [newPayment] } = await database_1.pool.query(`INSERT INTO payments (booking_id, amount, payment_method, transaction_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [booking_id, amount, payment_method, transaction_id]);
        // Create initial transaction record
        await database_1.pool.query(`INSERT INTO payment_transactions (payment_id, amount, status, transaction_id)
       VALUES ($1, $2, 'PENDING', $3)`, [newPayment.id, amount, transaction_id]);
        res.status(201).json({
            status: 'success',
            data: newPayment
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createPayment = createPayment;
const updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { payment_status, transaction_id, payment_date } = req.body;
        // Check if payment exists
        const { rows: payments } = await database_1.pool.query('SELECT * FROM payments WHERE id = $1', [id]);
        if (payments.length === 0) {
            return next(new error_middleware_1.AppError('Payment not found', 404));
        }
        const payment = payments[0];
        // Update payment status
        const { rows: [updatedPayment] } = await database_1.pool.query(`UPDATE payments 
       SET payment_status = $1, 
           transaction_id = COALESCE($2, transaction_id),
           payment_date = COALESCE($3, payment_date)
       WHERE id = $4
       RETURNING *`, [payment_status, transaction_id, payment_date, id]);
        // Create new transaction record
        await database_1.pool.query(`INSERT INTO payment_transactions (payment_id, amount, status, transaction_id, payment_date)
       VALUES ($1, $2, $3, $4, $5)`, [id, payment.amount, payment_status, transaction_id, payment_date]);
        // If payment is completed, update booking status
        if (payment_status === 'COMPLETED') {
            await database_1.pool.query('UPDATE bookings SET status = $1 WHERE id = $2', ['CONFIRMED', payment.booking_id]);
        }
        res.json({
            status: 'success',
            data: updatedPayment
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
const getPaymentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows: payments } = await database_1.pool.query(`SELECT p.*, b.check_in_date, b.check_out_date, h.name as homestay_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN homestays h ON b.homestay_id = h.id
       WHERE p.id = $1`, [id]);
        if (payments.length === 0) {
            return next(new error_middleware_1.AppError('Payment not found', 404));
        }
        // Get payment transactions
        const { rows: transactions } = await database_1.pool.query('SELECT * FROM payment_transactions WHERE payment_id = $1 ORDER BY created_at DESC', [id]);
        res.json({
            status: 'success',
            data: Object.assign(Object.assign({}, payments[0]), { transactions })
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentById = getPaymentById;
const getPaymentsByBooking = async (req, res, next) => {
    try {
        const { booking_id } = req.params;
        const { rows: payments } = await database_1.pool.query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC', [booking_id]);
        res.json({
            status: 'success',
            data: payments
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentsByBooking = getPaymentsByBooking;
const getPaymentsByUser = async (req, res, next) => {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { rows: payments } = await database_1.pool.query(`SELECT p.*, b.check_in_date, b.check_out_date, h.name as homestay_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN homestays h ON b.homestay_id = h.id
       WHERE b.user_id = $1
       ORDER BY p.created_at DESC`, [user_id]);
        res.json({
            status: 'success',
            data: payments
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentsByUser = getPaymentsByUser;
// Get all payments (admin access)
const getAllPayments = async (req, res, next) => {
    var _a, _b;
    try {
        // Check if user is admin
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_type;
        // Only super_admin can access all payments
        if (userType !== 'admin' || userRole !== 'super_admin') {
            return next(new error_middleware_1.AppError('Unauthorized. Super admin access required.', 403));
        }
        // Parse query parameters
        const status = req.query.status;
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '20');
        const offset = (page - 1) * limit;
        // Build the query dynamically based on filters
        let query = `
      SELECT p.*, 
             b.booking_number, b.start_date, b.end_date,
             hr.title as room_title,
             h.id as homestay_id, h.title as homestay_title
      FROM "payments" p
      JOIN "booking" b ON p.booking_id = b.id
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
    `;
        const queryParams = [];
        let whereConditions = [];
        // Add filters
        if (status) {
            whereConditions.push(`p.payment_status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }
        if (startDate) {
            whereConditions.push(`p.payment_date >= $${queryParams.length + 1}`);
            queryParams.push(startDate);
        }
        if (endDate) {
            whereConditions.push(`p.payment_date <= $${queryParams.length + 1}`);
            queryParams.push(endDate);
        }
        // Add WHERE clause if there are conditions
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        // Add ORDER BY and pagination
        query += ` ORDER BY p.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        // Execute query
        const { rows } = await database_1.pool.query(query, queryParams);
        // Get total count for pagination
        const countQuery = `
      SELECT COUNT(*) as total
      FROM "payments" p
      JOIN "booking" b ON p.booking_id = b.id
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      ${whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : ''}
    `;
        const { rows: countResult } = await database_1.pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
        const total = parseInt(countResult[0].total);
        res.json({
            status: 'success',
            data: rows,
            meta: {
                total,
                page,
                limit
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllPayments = getAllPayments;
