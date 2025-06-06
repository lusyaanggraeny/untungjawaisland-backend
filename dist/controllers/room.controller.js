"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomBlockedPeriods = exports.getHomestayRoomsStatus = exports.getRoomStatus = exports.updateRoomStatus = exports.updateRoomAvailability = exports.getAllRooms = exports.getRoomById = void 0;
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
// Get dynamic room status with booking information
const getRoomStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Validate room ID
        const roomIdNum = parseInt(id, 10);
        if (isNaN(roomIdNum)) {
            return next(new error_middleware_1.AppError('Invalid room ID', 400));
        }
        // Get room with dynamic status calculation
        const { rows } = await database_1.pool.query(`SELECT 
        r.id as room_id,
        r.status as static_status,
        CASE 
          WHEN r.status = 'maintenance' THEN 'maintenance'
          WHEN EXISTS (
            SELECT 1 FROM "booking" b 
            WHERE b.room_id = r.id 
              AND b.start_date <= CURRENT_DATE 
              AND b.end_date >= CURRENT_DATE
              AND b.status IN ('confirmed', 'pending')
          ) THEN 'occupied'
          ELSE 'available'
        END as dynamic_status,
        CASE 
          WHEN r.status = 'maintenance' THEN false
          WHEN EXISTS (
            SELECT 1 FROM "booking" b 
            WHERE b.room_id = r.id 
              AND b.start_date <= CURRENT_DATE 
              AND b.end_date >= CURRENT_DATE
              AND b.status IN ('confirmed', 'pending')
          ) THEN false
          ELSE true
        END as is_bookable
      FROM "homestayRoom" r 
      WHERE r.id = $1`, [roomIdNum]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('Room not found', 404));
        }
        const room = rows[0];
        // Get next available date if room is not bookable
        let nextAvailableDate = null;
        let maintenanceEndDate = null;
        let reason = '';
        if (!room.is_bookable) {
            if (room.static_status === 'maintenance') {
                reason = 'Room is under maintenance';
                // You might want to add a maintenance_end_date field to the room table
            }
            else if (room.dynamic_status === 'occupied') {
                reason = 'Room is currently occupied';
                // Get next available date
                const { rows: nextAvailableRows } = await database_1.pool.query(`SELECT MIN(end_date + INTERVAL '1 day') as next_available
           FROM "booking"
           WHERE room_id = $1
             AND end_date >= CURRENT_DATE
             AND status IN ('confirmed', 'pending')`, [roomIdNum]);
                nextAvailableDate = nextAvailableRows[0].next_available;
            }
        }
        else {
            reason = 'Room is available for booking';
        }
        res.json({
            status: 'success',
            data: {
                room_id: room.room_id,
                static_status: room.static_status,
                dynamic_status: room.dynamic_status,
                is_bookable: room.is_bookable,
                reason: reason,
                next_available_date: nextAvailableDate,
                maintenance_end_date: maintenanceEndDate
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRoomStatus = getRoomStatus;
// Get bulk room status for a homestay
const getHomestayRoomsStatus = async (req, res, next) => {
    try {
        const { homestayId } = req.params;
        // Validate homestay ID
        const homestayIdNum = parseInt(homestayId, 10);
        if (isNaN(homestayIdNum)) {
            return next(new error_middleware_1.AppError('Invalid homestay ID', 400));
        }
        // Check if homestay exists
        const { rows: homestayRows } = await database_1.pool.query('SELECT id FROM "homestay" WHERE id = $1', [homestayIdNum]);
        if (homestayRows.length === 0) {
            return next(new error_middleware_1.AppError('Homestay not found', 404));
        }
        // Get all rooms with their status
        const { rows } = await database_1.pool.query(`SELECT 
        r.id as room_id,
        r.room_number,
        r.status as static_status,
        CASE 
          WHEN r.status = 'maintenance' THEN 'maintenance'
          WHEN EXISTS (
            SELECT 1 FROM "booking" b 
            WHERE b.room_id = r.id 
              AND b.start_date <= CURRENT_DATE 
              AND b.end_date >= CURRENT_DATE
              AND b.status IN ('confirmed', 'pending')
          ) THEN 'occupied'
          ELSE 'available'
        END as dynamic_status,
        CASE 
          WHEN r.status = 'maintenance' THEN false
          WHEN EXISTS (
            SELECT 1 FROM "booking" b 
            WHERE b.room_id = r.id 
              AND b.start_date <= CURRENT_DATE 
              AND b.end_date >= CURRENT_DATE
              AND b.status IN ('confirmed', 'pending')
          ) THEN false
          ELSE true
        END as is_bookable,
        CASE 
          WHEN r.status = 'maintenance' OR EXISTS (
            SELECT 1 FROM "booking" b 
            WHERE b.room_id = r.id 
              AND b.start_date <= CURRENT_DATE 
              AND b.end_date >= CURRENT_DATE
              AND b.status IN ('confirmed', 'pending')
          ) THEN (
            SELECT MIN(end_date + INTERVAL '1 day')
            FROM "booking"
            WHERE room_id = r.id
              AND end_date >= CURRENT_DATE
              AND status IN ('confirmed', 'pending')
          )
          ELSE NULL
        END as next_available_date,
        (
          SELECT end_date
          FROM "booking"
          WHERE room_id = r.id
            AND start_date <= CURRENT_DATE 
            AND end_date >= CURRENT_DATE
            AND status IN ('confirmed', 'pending')
          ORDER BY end_date DESC
          LIMIT 1
        ) as current_booking_end
      FROM "homestayRoom" r 
      WHERE r.homestay_id = $1
      ORDER BY r.room_number`, [homestayIdNum]);
        const roomsStatus = rows.map(row => ({
            room_id: row.room_id,
            room_number: row.room_number,
            static_status: row.static_status,
            dynamic_status: row.dynamic_status,
            is_bookable: row.is_bookable,
            next_available_date: row.next_available_date,
            current_booking_end: row.current_booking_end
        }));
        res.json({
            status: 'success',
            data: roomsStatus
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getHomestayRoomsStatus = getHomestayRoomsStatus;
// Get blocked periods for a specific room (for enhanced date picker)
const getRoomBlockedPeriods = async (req, res, next) => {
    try {
        const { id: roomId } = req.params;
        const { start_date, end_date } = req.query;
        // Validate room ID
        const roomIdNum = parseInt(roomId, 10);
        if (isNaN(roomIdNum)) {
            return next(new error_middleware_1.AppError('Invalid room ID', 400));
        }
        // Validate date format if provided
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (start_date && !dateRegex.test(start_date)) {
            return next(new error_middleware_1.AppError('Invalid start_date format. Use YYYY-MM-DD', 400));
        }
        if (end_date && !dateRegex.test(end_date)) {
            return next(new error_middleware_1.AppError('Invalid end_date format. Use YYYY-MM-DD', 400));
        }
        // Default date range: today to 3 months ahead
        const today = new Date();
        const startDate = start_date || today.toISOString().split('T')[0];
        const futureDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
        const endDate = end_date || futureDate.toISOString().split('T')[0];
        // Check if room exists
        const { rows: roomRows } = await database_1.pool.query('SELECT id, title, room_number FROM "homestayRoom" WHERE id = $1', [roomIdNum]);
        if (roomRows.length === 0) {
            return next(new error_middleware_1.AppError('Room not found', 404));
        }
        // Get all confirmed bookings for this room in the date range
        const { rows: bookings } = await database_1.pool.query(`SELECT 
        b.id,
        b.booking_number,
        b.start_date,
        b.end_date,
        b.status,
        b.notes,
        u.name as guest_name
      FROM "booking" b
      LEFT JOIN "landing_page_user" u ON b.user_id = u.id
      WHERE b.room_id = $1
        AND b.status IN ('confirmed', 'pending')
        AND NOT (b.end_date <= $2::date OR b.start_date >= $3::date)
      ORDER BY b.start_date ASC`, [roomIdNum, startDate, endDate]);
        // Format blocked periods for frontend
        const blockedPeriods = bookings.map(booking => {
            // Extract guest name from notes if no user linked
            let guestName = booking.guest_name || 'Reserved';
            if (!booking.guest_name && booking.notes) {
                const guestMatch = booking.notes.match(/Guest:\s*([^,\n]+)/);
                if (guestMatch) {
                    guestName = guestMatch[1].trim();
                }
            }
            return {
                start_date: booking.start_date.toISOString().split('T')[0],
                end_date: booking.end_date.toISOString().split('T')[0],
                reason: `Booking #${booking.booking_number}`,
                guest_name: guestName,
                booking_id: booking.id,
                status: booking.status
            };
        });
        res.json({
            status: 'success',
            data: {
                room_id: roomIdNum,
                room_info: {
                    title: roomRows[0].title,
                    room_number: roomRows[0].room_number
                },
                date_range: {
                    start_date: startDate,
                    end_date: endDate
                },
                blocked_periods: blockedPeriods,
                total_blocked_periods: blockedPeriods.length
            }
        });
    }
    catch (error) {
        console.error('[ROOM] Error fetching blocked periods:', error);
        next(error);
    }
};
exports.getRoomBlockedPeriods = getRoomBlockedPeriods;
