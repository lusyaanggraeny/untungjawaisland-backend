"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRoutes = void 0;
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/homestay/:homestayId', review_controller_1.getReviewsByHomestay); // Get reviews for a specific homestay
// Protected routes
router.use(auth_middleware_1.authenticateToken);
// Admin routes
router.get('/', review_controller_1.getAllReviews); // Get all reviews (admin)
router.get('/:id', review_controller_1.getReviewById); // Get specific review
router.put('/:id', review_controller_1.updateReview); // Update review status or respond
router.delete('/:id', review_controller_1.deleteReview); // Delete review
// User routes  
router.post('/', review_controller_1.createReview); // Create new review
router.get('/user/my', review_controller_1.getReviewsByUser); // Get user's reviews
exports.reviewRoutes = router;
