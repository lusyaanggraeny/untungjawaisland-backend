import { Router } from 'express';
import {
  checkRoomAvailability,
  checkSameDayAvailability,
  createBooking,
  createGuestBooking,
  getAllBookings,
  getBookingById,
  getBookingsByHomestay,
  getBookingsByOwner,
  getMyBookings,
  getRoomBookings,
  getUserBookings,
  updateBookingStatus
} from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// New admin routes
router.get('/', authenticateToken, getAllBookings);
router.get('/owner/:ownerId', authenticateToken, getBookingsByOwner);
router.get('/homestay/:homestayId', authenticateToken, getBookingsByHomestay);

// Enhanced room booking routes
router.get('/room/:roomId/availability', checkRoomAvailability);
router.get('/room/:roomId/same-day-availability', checkSameDayAvailability);
router.get('/room/:roomId', getRoomBookings);

// User routes
router.get('/my', authenticateToken, getMyBookings);

// Existing routes
router.post('/', authenticateToken, createBooking);
router.post('/guest', createGuestBooking);
router.get('/:id', authenticateToken, getBookingById);
router.get('/user/:userId', authenticateToken, getUserBookings);
router.put('/:id/status', authenticateToken, updateBookingStatus);

export const bookingRoutes = router;