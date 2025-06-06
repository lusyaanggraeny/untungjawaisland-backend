"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRoutes = void 0;
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// New admin routes
router.get('/', auth_middleware_1.authenticateToken, booking_controller_1.getAllBookings); // Admin access to all bookings
router.get('/owner/:ownerId', auth_middleware_1.authenticateToken, booking_controller_1.getBookingsByOwner); // Owner's homestay bookings
router.get('/homestay/:homestayId', auth_middleware_1.authenticateToken, booking_controller_1.getBookingsByHomestay); // Specific homestay bookings
// Enhanced room booking routes
router.get('/room/:roomId/availability', booking_controller_1.checkRoomAvailability); // Enhanced availability check
router.get('/room/:roomId/same-day-availability', booking_controller_1.checkSameDayAvailability); // Same-day booking with early checkout
router.get('/room/:roomId', booking_controller_1.getRoomBookings); // Get all bookings for a room
// User routes
router.get('/my', auth_middleware_1.authenticateToken, booking_controller_1.getMyBookings); // Current user's bookings
// Existing routes
router.post('/', auth_middleware_1.authenticateToken, booking_controller_1.createBooking);
// Public route for guest bookings - no authentication required
router.post('/guest', booking_controller_1.createGuestBooking);
router.get('/:id', auth_middleware_1.authenticateToken, booking_controller_1.getBookingById);
router.get('/user/:userId', auth_middleware_1.authenticateToken, booking_controller_1.getUserBookings);
router.put('/:id/status', auth_middleware_1.authenticateToken, booking_controller_1.updateBookingStatus);
exports.bookingRoutes = router;
