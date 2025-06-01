import { Router } from 'express';
import { getRoomById, getAllRooms } from '../controllers/room.controller';

const router = Router();

// Public routes - no authentication required for viewing rooms
router.get('/', getAllRooms);          // GET /api/rooms
router.get('/:id', getRoomById);       // GET /api/rooms/:id

export default router; 