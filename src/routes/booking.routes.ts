import { Router } from 'express';
import { 
  createBooking, 
  createGuestBooking,
  getBookingById, 
  getUserBookings,
  getMyBookings,
  updateBookingStatus,
  checkRoomAvailability,
  getAllBookings,
  getBookingsByOwner,
  getBookingsByHomestay
} from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// New admin routes
router.get('/', authenticateToken, getAllBookings); // Admin access to all bookings
router.get('/owner/:ownerId', authenticateToken, getBookingsByOwner); // Owner's homestay bookings
router.get('/homestay/:homestayId', authenticateToken, getBookingsByHomestay); // Specific homestay bookings

// User routes
router.get('/my', authenticateToken, getMyBookings); // Current user's bookings

// Existing routes
router.post('/', authenticateToken, createBooking);
// Public route for guest bookings - no authentication required
router.post('/guest', createGuestBooking);
// Room availability check - public route
router.get('/room/:roomId/availability', checkRoomAvailability);
router.get('/:id', authenticateToken, getBookingById);
router.get('/user/:userId', authenticateToken, getUserBookings);
router.put('/:id/status', authenticateToken, updateBookingStatus);

export const bookingRoutes = router; 