"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReviews = exports.deleteReview = exports.updateReview = exports.getReviewsByUser = exports.getReviewsByHomestay = exports.getReviewById = exports.createReview = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
// Create a new review
const createReview = async (req, res, next) => {
    var _a;
    try {
        const { homestay_id, room_id, rating, comment } = req.body;
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return next(new error_middleware_1.AppError('User authentication required', 401));
        }
        if (!homestay_id || !rating) {
            return next(new error_middleware_1.AppError('Homestay ID and rating are required', 400));
        }
        if (rating < 1 || rating > 5) {
            return next(new error_middleware_1.AppError('Rating must be between 1 and 5', 400));
        }
        const { rows: [review] } = await database_1.pool.query(`INSERT INTO "reviews" (user_id, homestay_id, room_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [user_id, homestay_id, room_id || null, rating, comment || null]);
        res.status(201).json({
            status: 'success',
            data: review
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createReview = createReview;
// Get review by ID
const getReviewById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows } = await database_1.pool.query(`SELECT r.*, 
              u.name as user_name,
              h.title as homestay_title,
              hr.title as room_title
       FROM "reviews" r
       LEFT JOIN "landing_page_user" u ON r.user_id = u.id
       LEFT JOIN "homestay" h ON r.homestay_id = h.id
       LEFT JOIN "homestayRoom" hr ON r.room_id = hr.id
       WHERE r.id = $1`, [id]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('Review not found', 404));
        }
        res.json({
            status: 'success',
            data: rows[0]
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReviewById = getReviewById;
// Get reviews for a specific homestay
const getReviewsByHomestay = async (req, res, next) => {
    try {
        const { homestayId } = req.params;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        const { rows } = await database_1.pool.query(`SELECT r.*, 
              u.name as user_name,
              hr.title as room_title
       FROM "reviews" r
       LEFT JOIN "landing_page_user" u ON r.user_id = u.id
       LEFT JOIN "homestayRoom" hr ON r.room_id = hr.id
       WHERE r.homestay_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`, [homestayId, limit, offset]);
        // Get total count
        const { rows: countResult } = await database_1.pool.query('SELECT COUNT(*) as total FROM "reviews" WHERE homestay_id = $1', [homestayId]);
        const total = parseInt(countResult[0].total);
        // Get average rating
        const { rows: avgResult } = await database_1.pool.query('SELECT AVG(rating) as average_rating FROM "reviews" WHERE homestay_id = $1', [homestayId]);
        const averageRating = parseFloat(avgResult[0].average_rating) || 0;
        res.json({
            status: 'success',
            data: rows,
            meta: {
                total,
                page,
                limit,
                average_rating: Math.round(averageRating * 10) / 10
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReviewsByHomestay = getReviewsByHomestay;
// Get reviews by user
const getReviewsByUser = async (req, res, next) => {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return next(new error_middleware_1.AppError('User authentication required', 401));
        }
        const { rows } = await database_1.pool.query(`SELECT r.*, 
              h.title as homestay_title,
              hr.title as room_title
       FROM "reviews" r
       LEFT JOIN "homestay" h ON r.homestay_id = h.id
       LEFT JOIN "homestayRoom" hr ON r.room_id = hr.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`, [user_id]);
        res.json({
            status: 'success',
            data: rows
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReviewsByUser = getReviewsByUser;
// Update review (for admin moderation or user editing)
const updateReview = async (req, res, next) => {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const { rating, comment, status } = req.body;
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Check if review exists and get owner
        const { rows: reviewRows } = await database_1.pool.query('SELECT * FROM "reviews" WHERE id = $1', [id]);
        if (reviewRows.length === 0) {
            return next(new error_middleware_1.AppError('Review not found', 404));
        }
        const review = reviewRows[0];
        // Check permissions - user can edit their own review or admin can moderate
        const isOwner = review.user_id === user_id;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'super_admin' || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === 'homestay_owner';
        if (!isOwner && !isAdmin) {
            return next(new error_middleware_1.AppError('Not authorized to update this review', 403));
        }
        // Build update query dynamically
        const updates = [];
        const values = [];
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return next(new error_middleware_1.AppError('Rating must be between 1 and 5', 400));
            }
            updates.push(`rating = $${values.length + 1}`);
            values.push(rating);
        }
        if (comment !== undefined) {
            updates.push(`comment = $${values.length + 1}`);
            values.push(comment);
        }
        if (status !== undefined && isAdmin) {
            updates.push(`status = $${values.length + 1}`);
            values.push(status);
        }
        if (updates.length === 0) {
            return next(new error_middleware_1.AppError('No fields to update', 400));
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const { rows: [updatedReview] } = await database_1.pool.query(`UPDATE "reviews" SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
        res.json({
            status: 'success',
            data: updatedReview
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateReview = updateReview;
// Delete review
const deleteReview = async (req, res, next) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Check if review exists and get owner
        const { rows: reviewRows } = await database_1.pool.query('SELECT * FROM "reviews" WHERE id = $1', [id]);
        if (reviewRows.length === 0) {
            return next(new error_middleware_1.AppError('Review not found', 404));
        }
        const review = reviewRows[0];
        // Check permissions - user can delete their own review or admin can delete any
        const isOwner = review.user_id === user_id;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'super_admin';
        if (!isOwner && !isAdmin) {
            return next(new error_middleware_1.AppError('Not authorized to delete this review', 403));
        }
        await database_1.pool.query('DELETE FROM "reviews" WHERE id = $1', [id]);
        res.json({
            status: 'success',
            message: 'Review deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteReview = deleteReview;
// Get all reviews (admin)
const getAllReviews = async (req, res, next) => {
    var _a;
    try {
        // Check if user is admin
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (userRole !== 'super_admin' && userRole !== 'homestay_owner') {
            return next(new error_middleware_1.AppError('Admin access required', 403));
        }
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '20');
        const offset = (page - 1) * limit;
        const rating = req.query.rating;
        const homestayId = req.query.homestay_id;
        // Build query with filters
        let query = `
      SELECT r.*, 
             u.name as user_name, u.email as user_email,
             h.title as homestay_title,
             hr.title as room_title
      FROM "reviews" r
      LEFT JOIN "landing_page_user" u ON r.user_id = u.id
      LEFT JOIN "homestay" h ON r.homestay_id = h.id
      LEFT JOIN "homestayRoom" hr ON r.room_id = hr.id
    `;
        const queryParams = [];
        const conditions = [];
        if (rating) {
            conditions.push(`r.rating = $${queryParams.length + 1}`);
            queryParams.push(rating);
        }
        if (homestayId) {
            conditions.push(`r.homestay_id = $${queryParams.length + 1}`);
            queryParams.push(homestayId);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ` ORDER BY r.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        const { rows } = await database_1.pool.query(query, queryParams);
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM "reviews" r';
        let countParams = [];
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
            countParams = queryParams.slice(0, -2); // Remove limit and offset
        }
        const { rows: countResult } = await database_1.pool.query(countQuery, countParams);
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
exports.getAllReviews = getAllReviews;
