"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const room_controller_1 = require("../controllers/room.controller");
const router = (0, express_1.Router)();
// Public routes - no authentication required for viewing rooms
router.get('/', room_controller_1.getAllRooms); // GET /api/rooms
router.get('/:id', room_controller_1.getRoomById); // GET /api/rooms/:id
// Update routes - for managing room status
router.put('/:id/availability', room_controller_1.updateRoomAvailability); // PUT /api/rooms/:id/availability
router.put('/:id/status', room_controller_1.updateRoomStatus); // PUT /api/rooms/:id/status
exports.default = router;
