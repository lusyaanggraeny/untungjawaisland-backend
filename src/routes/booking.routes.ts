import { Router } from 'express';
import { 
  createBooking, 
  createGuestBooking,
  getBookingById, 
  getUserBookings,
  updateBookingStatus,
  checkRoomAvailability
} from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createBooking);
// Public route for guest bookings - no authentication required
router.post('/guest', createGuestBooking);
// Room availability check - public route
router.get('/room/:roomId/availability', checkRoomAvailability);
router.get('/:id', authenticateToken, getBookingById);
router.get('/user/:userId', authenticateToken, getUserBookings);
router.put('/:id/status', authenticateToken, updateBookingStatus);

export const bookingRoutes = router; 