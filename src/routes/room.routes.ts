import { Router } from 'express';
import { 
  getRoomById, 
  getAllRooms, 
  updateRoomAvailability, 
  updateRoomStatus,
  getRoomStatus,
  getHomestayRoomsStatus,
  getRoomBlockedPeriods
} from '../controllers/room.controller';

const router = Router();

// Public routes - no authentication required for viewing rooms
router.get('/', getAllRooms);                     // GET /api/rooms

// Homestay rooms status (must come before /:id routes)
router.get('/homestay/:homestayId/status', getHomestayRoomsStatus); // GET /api/rooms/homestay/:homestayId/status

// Specific room routes (must come before generic /:id route)
router.get('/:id/blocked-periods', getRoomBlockedPeriods); // GET /api/rooms/:id/blocked-periods - for enhanced date picker
router.get('/:id/status', getRoomStatus);         // GET /api/rooms/:id/status - dynamic status with booking info

// Generic room routes
router.get('/:id', getRoomById);                  // GET /api/rooms/:id

// Update routes - for managing room status
router.put('/:id/availability', updateRoomAvailability);  // PUT /api/rooms/:id/availability
router.put('/:id/status', updateRoomStatus);              // PUT /api/rooms/:id/status

export default router; 