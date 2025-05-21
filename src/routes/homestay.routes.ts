import express from 'express';
import {
  getAllHomestays,
  getHomestayById,
  createHomestay,
  updateHomestay,
  deleteHomestay,
  addHomestayImage
} from '../controllers/homestay.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/', getAllHomestays);
router.get('/:id', getHomestayById);

// Protected routes (require authentication)
router.post('/', authenticateToken, createHomestay);
router.put('/:id', authenticateToken, updateHomestay);
router.delete('/:id', authenticateToken, deleteHomestay);

// New route for adding an image to a specific homestay
router.post('/:homestayId/images', authenticateToken, addHomestayImage);

export default router; 