import { Router } from 'express';
import { 
  createReview,
  getReviewById,
  getReviewsByHomestay,
  getReviewsByUser,
  updateReview,
  deleteReview,
  getAllReviews
} from '../controllers/review.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/homestay/:homestayId', getReviewsByHomestay); // Get reviews for a specific homestay

// Protected routes
router.use(authenticateToken);

// Admin routes
router.get('/', getAllReviews); // Get all reviews (admin)
router.get('/:id', getReviewById); // Get specific review
router.put('/:id', updateReview); // Update review status or respond
router.delete('/:id', deleteReview); // Delete review

// User routes  
router.post('/', createReview); // Create new review
router.get('/user/my', getReviewsByUser); // Get user's reviews

export const reviewRoutes = router; 