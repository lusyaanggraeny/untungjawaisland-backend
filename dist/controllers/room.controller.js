"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoomStatus = exports.updateRoomAvailability = exports.getAllRooms = exports.getRoomById = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
// Get room by ID with homestay information
const getRoomById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const roomId = parseInt(id, 10);
        if (isNaN(roomId)) {
            return next(new error_middleware_1.AppError('Invalid room ID', 400));
        }
        // Get room with homestay details
        const { rows } = await database_1.pool.query(`SELECT 
        hr.*,
        hr.id as room_id,
        hr.title as name,
        json_build_object(
          'id', h.id,
          'title', h.title,
          'address', h.address,
          'location', h.location,
          'contact_number', h.contact_number
        ) as homestay
      FROM "homestayRoom" hr
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE hr.id = $1`, [roomId]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('Room not found', 404));
        }
        const room = rows[0];
        res.json({
            status: 'success',
            data: room
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRoomById = getRoomById;
// Get all rooms with homestay information
const getAllRooms = async (req, res, next) => {
    try {
        const { rows } = await database_1.pool.query(`SELECT 
        hr.*,
        hr.id as room_id,
        hr.title as name,
        json_build_object(
          'id', h.id,
          'title', h.title,
          'address', h.address,
          'location', h.location,
          'contact_number', h.contact_number
        ) as homestay
      FROM "homestayRoom" hr
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE h.status = 'active'
      ORDER BY h.created_at DESC, hr.created_at ASC`);
        res.json({
            status: 'success',
            results: rows.length,
            data: rows
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllRooms = getAllRooms;
// NEW: Update room availability
const updateRoomAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { available, availability_status } = req.body;
        const roomId = parseInt(id, 10);
        if (isNaN(roomId)) {
            return next(new error_middleware_1.AppError('Invalid room ID', 400));
        }
        console.log(`[ROOM] Updating room ${roomId} availability:`, { available, availability_status });
        // Determine the new status based on availability
        let newStatus = 'available';
        if (!available) {
            newStatus = 'occupied';
        }
        else if (availability_status) {
            newStatus = availability_status;
        }
        // Update the room status in database
        const { rows } = await database_1.pool.query(`UPDATE "homestayRoom" 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, status, title, room_number`, [newStatus, roomId]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('Room not found', 404));
        }
        const updatedRoom = rows[0];
        console.log(`[ROOM] Successfully updated room ${roomId} status to: ${newStatus}`);
        res.json({
            status: 'success',
            message: `Room ${roomId} availability updated`,
            data: {
                id: updatedRoom.id,
                is_available: available,
                availability_status: newStatus,
                status: updatedRoom.status,
                title: updatedRoom.title,
                room_number: updatedRoom.room_number
            }
        });
    }
    catch (error) {
        console.error('[ROOM] Error updating room availability:', error);
        next(error);
    }
};
exports.updateRoomAvailability = updateRoomAvailability;
// NEW: Update room status directly
const updateRoomStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const roomId = parseInt(id, 10);
        if (isNaN(roomId)) {
            return next(new error_middleware_1.AppError('Invalid room ID', 400));
        }
        // Validate status
        const validStatuses = ['available', 'occupied', 'maintenance'];
        if (!validStatuses.includes(status)) {
            return next(new error_middleware_1.AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
        }
        console.log(`[ROOM] Updating room ${roomId} status to: ${status}`);
        // Update the room status in database
        const { rows } = await database_1.pool.query(`UPDATE "homestayRoom" 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, status, title, room_number`, [status, roomId]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('Room not found', 404));
        }
        const updatedRoom = rows[0];
        console.log(`[ROOM] Successfully updated room ${roomId} status to: ${status}`);
        res.json({
            status: 'success',
            message: `Room ${roomId} status updated to ${status}`,
            data: {
                id: updatedRoom.id,
                status: updatedRoom.status,
                title: updatedRoom.title,
                room_number: updatedRoom.room_number
            }
        });
    }
    catch (error) {
        console.error('[ROOM] Error updating room status:', error);
        next(error);
    }
};
exports.updateRoomStatus = updateRoomStatus;
