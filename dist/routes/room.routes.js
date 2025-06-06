"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const room_controller_1 = require("../controllers/room.controller");
const router = (0, express_1.Router)();
// Public routes - no authentication required for viewing rooms
router.get('/', room_controller_1.getAllRooms); // GET /api/rooms
// Homestay rooms status (must come before /:id routes)
router.get('/homestay/:homestayId/status', room_controller_1.getHomestayRoomsStatus); // GET /api/rooms/homestay/:homestayId/status
// Specific room routes (must come before generic /:id route)
router.get('/:id/blocked-periods', room_controller_1.getRoomBlockedPeriods); // GET /api/rooms/:id/blocked-periods - for enhanced date picker
router.get('/:id/status', room_controller_1.getRoomStatus); // GET /api/rooms/:id/status - dynamic status with booking info
// Generic room routes
router.get('/:id', room_controller_1.getRoomById); // GET /api/rooms/:id
// Update routes - for managing room status
router.put('/:id/availability', room_controller_1.updateRoomAvailability); // PUT /api/rooms/:id/availability
router.put('/:id/status', room_controller_1.updateRoomStatus); // PUT /api/rooms/:id/status
exports.default = router;
