import { Router } from 'express';
import { 
  getRoomById, 
  getAllRooms, 
  updateRoomAvailability, 
  updateRoomStatus 
} from '../controllers/room.controller';

const router = Router();

// Public routes - no authentication required for viewing rooms
router.get('/', getAllRooms);                     // GET /api/rooms
router.get('/:id', getRoomById);                  // GET /api/rooms/:id

// Update routes - for managing room status
router.put('/:id/availability', updateRoomAvailability);  // PUT /api/rooms/:id/availability
router.put('/:id/status', updateRoomStatus);              // PUT /api/rooms/:id/status

export default router; 