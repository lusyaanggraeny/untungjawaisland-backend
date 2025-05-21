import { Router } from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/landing_user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', authenticateToken, getUserProfile);

export const landingUserRoutes = router; 