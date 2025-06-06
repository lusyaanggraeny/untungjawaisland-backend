import { Router } from 'express';
import { 
  createBooking, 
  createGuestBooking,
  getBookingById, 
  getUserBookings,
  getMyBookings,
  updateBookingStatus,
  checkRoomAvailability,
  checkSameDayAvailability,
  getRoomBookings,
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

// Enhanced room booking routes
router.get('/room/:roomId/availability', checkRoomAvailability); // Enhanced availability check
router.get('/room/:roomId/same-day-availability', checkSameDayAvailability); // Same-day booking with early checkout
router.get('/room/:roomId', getRoomBookings); // Get all bookings for a room

// User routes
router.get('/my', authenticateToken, getMyBookings); // Current user's bookings

// Existing routes
router.post('/', authenticateToken, createBooking);
// Public route for guest bookings - no authentication required
router.post('/guest', createGuestBooking);
router.get('/:id', authenticateToken, getBookingById);
router.get('/user/:userId', authenticateToken, getUserBookings);
router.put('/:id/status', authenticateToken, updateBookingStatus);

export const bookingRoutes = router; 