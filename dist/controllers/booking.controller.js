"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingsByHomestay = exports.getBookingsByOwner = exports.getAllBookings = exports.checkRoomAvailability = exports.createGuestBooking = exports.updateBookingStatus = exports.getMyBookings = exports.getUserBookings = exports.getBookingById = exports.createBooking = void 0;
const database_1 = require("../config/database");
const booking_types_1 = require("../types/booking.types");
const error_middleware_1 = require("../middleware/error.middleware");
const email_service_1 = require("../services/email.service");
const user_types_1 = require("../types/user.types");
// Generate a unique booking number
const generateBookingNumber = () => {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
};
// Create a new booking
const createBooking = async (req, res, next) => {
    var _a, _b;
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const { start_date, end_date, room_id, number_of_guests, special_requests, notes, check_in_time, check_out_time, payment_method } = req.body;
        // Validate required fields
        if (!start_date || !end_date || !room_id || !number_of_guests) {
            return next(new error_middleware_1.AppError('Start date, end date, room ID and number of guests are required', 400));
        }
        // Get user ID from the token
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const isLandingUser = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.user_type) === 'landing_user';
        // Verify user exists if landing user
        if (isLandingUser && userId) {
            const { rows } = await client.query('SELECT id FROM "landing_page_user" WHERE id = $1', [userId]);
            if (rows.length === 0) {
                return next(new error_middleware_1.AppError('User not found', 404));
            }
        }
        // Verify room exists and is available
        const { rows: roomRows } = await client.query('SELECT hr.*, h.base_price, h.title as homestay_title FROM "homestayRoom" hr JOIN "homestay" h ON hr.homestay_id = h.id WHERE hr.id = $1', [room_id]);
        if (roomRows.length === 0) {
            return next(new error_middleware_1.AppError('Room not found', 404));
        }
        const room = roomRows[0];
        // Check if room is available for the requested dates
        const { rows: existingBookings } = await client.query(`SELECT * FROM "booking" 
       WHERE room_id = $1 
       AND status != $2
       AND (
         (start_date <= $3 AND end_date >= $3) OR
         (start_date <= $4 AND end_date >= $4) OR
         (start_date >= $3 AND end_date <= $4)
       )`, [room_id, booking_types_1.BookingStatus.CANCELLED, start_date, end_date]);
        if (existingBookings.length > 0) {
            return next(new error_middleware_1.AppError('Room is not available for the selected dates', 400));
        }
        // Calculate total price
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        if (nights <= 0) {
            return next(new error_middleware_1.AppError('End date must be after start date', 400));
        }
        const totalPrice = room.price * nights;
        const bookingNumber = generateBookingNumber();
        // Create the booking
        const { rows: [newBooking] } = await client.query(`INSERT INTO "booking" (
        start_date, end_date, room_id, status, is_paid, user_id, 
        booking_number, total_price, payment_method, check_in_time, 
        check_out_time, number_of_guests, notes, special_requests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`, [
            start_date,
            end_date,
            room_id,
            booking_types_1.BookingStatus.PENDING,
            false,
            isLandingUser ? userId : null, // Only set user_id if it's a landing user
            bookingNumber,
            totalPrice,
            payment_method || null,
            check_in_time || null,
            check_out_time || null,
            number_of_guests,
            notes || null,
            special_requests || null
        ]);
        // IMPORTANT: Update the room status to occupied
        await client.query(`UPDATE "homestayRoom" SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [room_id]);
        console.log(`Room ${room_id} status updated to occupied for booking ${newBooking.id}`);
        await client.query('COMMIT');
        // Return room and homestay details along with the booking
        const bookingWithDetails = Object.assign(Object.assign({}, newBooking), { room: {
                id: room.id,
                title: room.title,
                room_number: room.room_number
            }, homestay: {
                id: room.homestay_id,
                title: room.homestay_title
            } });
        // Get user details for email (if this is a landing user booking)
        if (isLandingUser && userId) {
            try {
                const { rows: userRows } = await database_1.pool.query('SELECT name, email FROM "landing_page_user" WHERE id = $1', [userId]);
                if (userRows.length > 0) {
                    const user = userRows[0];
                    // Format dates for email
                    const formattedStartDate = new Date(start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    const formattedEndDate = new Date(end_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    // Send booking confirmation email to customer
                    await (0, email_service_1.sendBookingConfirmation)(user.email, {
                        bookingNumber: bookingNumber,
                        customerName: user.name,
                        homestayName: room.homestay_title,
                        roomName: room.room_number ? `${room.title} (Room ${room.room_number})` : room.title,
                        checkInDate: formattedStartDate,
                        checkOutDate: formattedEndDate,
                        totalPrice: totalPrice,
                        paymentStatus: 'Pending',
                        bookingStatus: 'Pending',
                        guestCount: number_of_guests,
                        specialRequests: special_requests || ''
                    }).catch(err => console.error('Error sending booking confirmation email:', err));
                    // Get admin email (homestay owner or system admin)
                    const { rows: adminRows } = await database_1.pool.query(`SELECT au.email FROM "admin_users" au 
             JOIN "homestay" h ON h.user_id = au.id 
             WHERE h.id = $1`, [room.homestay_id]);
                    if (adminRows.length > 0) {
                        // Send notification to homestay owner
                        await (0, email_service_1.sendBookingNotificationToAdmin)(adminRows[0].email, {
                            bookingNumber: bookingNumber,
                            customerName: user.name,
                            homestayName: room.homestay_title,
                            roomName: room.room_number ? `${room.title} (Room ${room.room_number})` : room.title,
                            checkInDate: formattedStartDate,
                            checkOutDate: formattedEndDate,
                            totalPrice: totalPrice,
                            paymentStatus: 'Pending',
                            bookingStatus: 'Pending',
                            guestCount: number_of_guests,
                            specialRequests: special_requests || ''
                        }).catch(err => console.error('Error sending admin notification email:', err));
                    }
                }
            }
            catch (emailError) {
                // Don't fail the request if email sending fails
                console.error('Error sending booking emails:', emailError);
            }
        }
        res.status(201).json({
            status: 'success',
            data: bookingWithDetails
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        next(error);
    }
    finally {
        client.release();
    }
};
exports.createBooking = createBooking;
// Get booking by ID
const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows } = await database_1.pool.query(`SELECT b.*, 
        hr.title as room_title, hr.room_number,
        h.title as homestay_title, h.id as homestay_id
       FROM "booking" b
       JOIN "homestayRoom" hr ON b.room_id = hr.id
       JOIN "homestay" h ON hr.homestay_id = h.id
       WHERE b.id = $1`, [id]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('Booking not found', 404));
        }
        const booking = rows[0];
        res.status(200).json({
            status: 'success',
            data: booking
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBookingById = getBookingById;
// Get all bookings for a user
const getUserBookings = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const userIdParam = parseInt(userId, 10);
        if (isNaN(userIdParam)) {
            return next(new error_middleware_1.AppError('Invalid user ID', 400));
        }
        // Check if the requesting user is authenticated
        const user = req.user; // Use any to handle both types
        if (!user || !user.id) {
            return next(new error_middleware_1.AppError('User not authenticated', 401));
        }
        // Check if user is admin (from admin_users table) or landing page user
        const isAdmin = 'role' in user && Object.values(user_types_1.AdminUserRole).includes(user.role);
        const isLandingUser = user.user_type === 'landing_user' || user.type === 'user';
        if (!isAdmin && !isLandingUser) {
            return next(new error_middleware_1.AppError('Invalid user type', 403));
        }
        // Landing page users can only view their own bookings unless they're admins
        if (isLandingUser && userIdParam !== user.id) {
            return next(new error_middleware_1.AppError('Not authorized to access these bookings', 403));
        }
        // Get all bookings for the user with related data
        const { rows } = await database_1.pool.query(`SELECT 
        b.*,
        json_build_object(
          'id', hr.id,
          'title', hr.title,
          'room_number', hr.room_number
        ) as room,
        json_build_object(
          'id', h.id,
          'title', h.title,
          'address', h.address
        ) as homestay
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC`, [userIdParam]);
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
exports.getUserBookings = getUserBookings;
// Get current user's bookings
const getMyBookings = async (req, res, next) => {
    try {
        // Check if the user is authenticated
        const user = req.user; // Use any to handle both types
        if (!user || !user.id) {
            return next(new error_middleware_1.AppError('User not authenticated', 401));
        }
        // Convert user ID to number for database query
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        if (isNaN(userId)) {
            return next(new error_middleware_1.AppError('Invalid user ID', 400));
        }
        // Get all bookings for the authenticated user with related data
        const { rows } = await database_1.pool.query(`SELECT 
        b.*,
        json_build_object(
          'id', hr.id,
          'title', hr.title,
          'room_number', hr.room_number,
          'price', hr.price
        ) as room,
        json_build_object(
          'id', h.id,
          'title', h.title,
          'address', h.address
        ) as homestay,
        json_build_object(
          'id', p.id,
          'amount', p.amount,
          'payment_status', p.payment_status,
          'payment_method', p.payment_method
        ) as payment
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      LEFT JOIN "payments" p ON b.id = p.booking_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC`, [userId]);
        res.json({
            status: 'success',
            results: rows.length,
            data: rows
        });
    }
    catch (error) {
        console.error('Error in getMyBookings:', error);
        next(error);
    }
};
exports.getMyBookings = getMyBookings;
// Update booking status
const updateBookingStatus = async (req, res, next) => {
    var _a;
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { status, cancellation_reason } = req.body;
        // Validate status
        if (!Object.values(booking_types_1.BookingStatus).includes(status)) {
            return next(new error_middleware_1.AppError('Invalid booking status', 400));
        }
        // Get the booking with room and homestay details
        const { rows } = await client.query(`SELECT b.*, 
              hr.title as room_title, hr.room_number,
              h.id as homestay_id, h.title as homestay_title, h.user_id as owner_id
       FROM "booking" b
       JOIN "homestayRoom" hr ON b.room_id = hr.id
       JOIN "homestay" h ON hr.homestay_id = h.id
       WHERE b.id = $1`, [id]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('Booking not found', 404));
        }
        const booking = rows[0];
        // Check authorization
        const user = req.user; // Use any to handle both types
        if (!user || !user.id) {
            return next(new error_middleware_1.AppError('User not authenticated', 401));
        }
        // Check if user is admin (from admin_users table) or landing page user
        const isAdmin = 'role' in user && Object.values(user_types_1.AdminUserRole).includes(user.role);
        const isLandingUser = user.user_type === 'landing_user' || user.type === 'user';
        if (!isAdmin && !isLandingUser) {
            return next(new error_middleware_1.AppError('Invalid user type', 403));
        }
        // Only allow status updates if:
        // 1. User is the booking owner (landing page user) - but they can only cancel
        // 2. User is an admin
        if (isLandingUser && booking.user_id !== user.id) {
            return next(new error_middleware_1.AppError('Not authorized to update this booking', 403));
        }
        if (isLandingUser && status !== booking_types_1.BookingStatus.CANCELLED) {
            return next(new error_middleware_1.AppError('Regular users can only cancel bookings', 403));
        }
        // Update the booking status
        const updateResult = await client.query(`UPDATE "booking" 
       SET status = $1, 
           cancellation_reason = $2,
           cancelled_at = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`, [
            status,
            cancellation_reason || null,
            status === booking_types_1.BookingStatus.CANCELLED ? new Date() : null,
            id
        ]);
        await client.query('COMMIT');
        // Send email notification for status update
        try {
            let customerEmail = '';
            let customerName = '';
            // Check if this is an authenticated user booking or guest booking
            if (booking.user_id) {
                // Get authenticated user details
                const { rows: userRows } = await database_1.pool.query('SELECT name, email FROM "landing_page_user" WHERE id = $1', [booking.user_id]);
                if (userRows.length > 0) {
                    customerEmail = userRows[0].email;
                    customerName = userRows[0].name;
                }
            }
            else {
                // Parse guest information from notes field
                const notesMatch = (_a = booking.notes) === null || _a === void 0 ? void 0 : _a.match(/Guest: ([^,]+), Email: ([^,]+), Phone: (.+)/);
                if (notesMatch) {
                    customerName = notesMatch[1];
                    customerEmail = notesMatch[2];
                }
            }
            if (customerEmail && customerName) {
                // Format dates for email
                const formattedStartDate = new Date(booking.start_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const formattedEndDate = new Date(booking.end_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                // Send status update email
                await (0, email_service_1.sendBookingStatusUpdate)(customerEmail, {
                    bookingNumber: booking.booking_number,
                    customerName: customerName,
                    homestayName: booking.homestay_title,
                    roomName: booking.room_number ? `${booking.room_title} (Room ${booking.room_number})` : booking.room_title,
                    checkInDate: formattedStartDate,
                    checkOutDate: formattedEndDate,
                    totalPrice: booking.total_price,
                    paymentStatus: booking.is_paid ? 'Paid' : 'Pending',
                    bookingStatus: status,
                    guestCount: booking.number_of_guests,
                    specialRequests: booking.special_requests || ''
                }, status).catch(err => console.error('Error sending status update email:', err));
            }
        }
        catch (emailError) {
            // Don't fail the request if email sending fails
            console.error('Error sending status update email:', emailError);
        }
        res.status(200).json({
            status: 'success',
            data: updateResult.rows[0]
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        next(error);
    }
    finally {
        client.release();
    }
};
exports.updateBookingStatus = updateBookingStatus;
// Create a guest booking (no authentication required)
const createGuestBooking = async (req, res, next) => {
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const { start_date, end_date, room_id, number_of_guests, guest_name, guest_email, guest_phone, special_requests, notes, check_in_time, check_out_time, payment_method } = req.body;
        // Validate required guest information
        if (!guest_name || !guest_email || !guest_phone) {
            return next(new error_middleware_1.AppError('Guest name, email, and phone are required', 400));
        }
        // Validate required booking fields
        if (!start_date || !end_date || !room_id || !number_of_guests) {
            return next(new error_middleware_1.AppError('Start date, end date, room ID and number of guests are required', 400));
        }
        // Verify room exists and is available
        const { rows: roomRows } = await client.query('SELECT hr.*, h.base_price, h.title as homestay_title FROM "homestayRoom" hr JOIN "homestay" h ON hr.homestay_id = h.id WHERE hr.id = $1', [room_id]);
        if (roomRows.length === 0) {
            return next(new error_middleware_1.AppError('Room not found', 404));
        }
        const room = roomRows[0];
        // Check if room is available for the requested dates
        const { rows: existingBookings } = await client.query(`SELECT * FROM "booking" 
       WHERE room_id = $1 
       AND status != $2
       AND (
         (start_date <= $3 AND end_date >= $3) OR
         (start_date <= $4 AND end_date >= $4) OR
         (start_date >= $3 AND end_date <= $4)
       )`, [room_id, booking_types_1.BookingStatus.CANCELLED, start_date, end_date]);
        if (existingBookings.length > 0) {
            return next(new error_middleware_1.AppError('Room is not available for the selected dates', 400));
        }
        // Calculate total price
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        if (nights <= 0) {
            return next(new error_middleware_1.AppError('End date must be after start date', 400));
        }
        const totalPrice = room.price * nights;
        const bookingNumber = generateBookingNumber();
        // Store guest info in notes field
        const guestInfo = `Guest: ${guest_name}, Email: ${guest_email}, Phone: ${guest_phone}`;
        const combinedNotes = notes ? `${notes}\n\n${guestInfo}` : guestInfo;
        // Create the booking
        const { rows: [newBooking] } = await client.query(`INSERT INTO "booking" (
        start_date, end_date, room_id, status, is_paid, user_id, 
        booking_number, total_price, payment_method, check_in_time, 
        check_out_time, number_of_guests, notes, special_requests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`, [
            start_date,
            end_date,
            room_id,
            booking_types_1.BookingStatus.PENDING,
            false,
            null, // No user_id for guest bookings
            bookingNumber,
            totalPrice,
            payment_method || null,
            check_in_time || null,
            check_out_time || null,
            number_of_guests,
            combinedNotes,
            special_requests || null
        ]);
        // IMPORTANT: Update the room status to occupied
        await client.query(`UPDATE "homestayRoom" SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [room_id]);
        console.log(`Room ${room_id} status updated to occupied for guest booking ${newBooking.id}`);
        await client.query('COMMIT');
        // Return room and homestay details along with the booking
        const bookingWithDetails = Object.assign(Object.assign({}, newBooking), { room: {
                id: room.id,
                title: room.title,
                room_number: room.room_number
            }, homestay: {
                id: room.homestay_id,
                title: room.homestay_title
            }, guest: {
                name: guest_name,
                email: guest_email,
                phone: guest_phone
            } });
        // Send emails for guest booking
        try {
            // Format dates for email
            const formattedStartDate = new Date(start_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedEndDate = new Date(end_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            // Send booking confirmation email to guest
            await (0, email_service_1.sendBookingConfirmation)(guest_email, {
                bookingNumber: bookingNumber,
                customerName: guest_name,
                homestayName: room.homestay_title,
                roomName: room.room_number ? `${room.title} (Room ${room.room_number})` : room.title,
                checkInDate: formattedStartDate,
                checkOutDate: formattedEndDate,
                totalPrice: totalPrice,
                paymentStatus: 'Pending',
                bookingStatus: 'Pending',
                guestCount: number_of_guests,
                specialRequests: special_requests || ''
            }).catch(err => console.error('Error sending guest booking confirmation email:', err));
            // Get admin email (homestay owner or system admin)
            const { rows: adminRows } = await database_1.pool.query(`SELECT au.email FROM "admin_users" au 
          JOIN "homestay" h ON h.user_id = au.id 
          WHERE h.id = $1`, [room.homestay_id]);
            if (adminRows.length > 0) {
                // Send notification to homestay owner with guest information
                await (0, email_service_1.sendBookingNotificationToAdmin)(adminRows[0].email, {
                    bookingNumber: bookingNumber,
                    customerName: guest_name,
                    homestayName: room.homestay_title,
                    roomName: room.room_number ? `${room.title} (Room ${room.room_number})` : room.title,
                    checkInDate: formattedStartDate,
                    checkOutDate: formattedEndDate,
                    totalPrice: totalPrice,
                    paymentStatus: 'Pending',
                    bookingStatus: 'Pending',
                    guestCount: number_of_guests,
                    specialRequests: special_requests || '',
                    guestEmail: guest_email,
                    guestPhone: guest_phone
                }).catch(err => console.error('Error sending admin notification email for guest booking:', err));
            }
        }
        catch (emailError) {
            // Don't fail the request if email sending fails
            console.error('Error sending guest booking emails:', emailError);
        }
        res.status(201).json({
            status: 'success',
            data: bookingWithDetails
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        next(error);
    }
    finally {
        client.release();
    }
};
exports.createGuestBooking = createGuestBooking;
// Check room availability
const checkRoomAvailability = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            return next(new error_middleware_1.AppError('Start date and end date are required', 400));
        }
        // Validate room ID
        const roomIdNum = parseInt(roomId, 10);
        if (isNaN(roomIdNum)) {
            return next(new error_middleware_1.AppError('Invalid room ID', 400));
        }
        // Get the room's current status
        const { rows: roomRows } = await database_1.pool.query('SELECT * FROM "homestayRoom" WHERE id = $1', [roomIdNum]);
        if (roomRows.length === 0) {
            return next(new error_middleware_1.AppError('Room not found', 404));
        }
        const room = roomRows[0];
        const roomStatus = room.status;
        // Check if any bookings exist for this room in the date range
        // IMPORTANT: Include PENDING bookings in this check
        const { rows: bookings } = await database_1.pool.query(`SELECT * FROM "booking" 
       WHERE room_id = $1 
       AND status != $2
       AND (
         (start_date <= $3 AND end_date >= $3) OR
         (start_date <= $4 AND end_date >= $4) OR
         (start_date >= $3 AND end_date <= $4)
       )`, [roomIdNum, booking_types_1.BookingStatus.CANCELLED, start_date, end_date]);
        // Room is unavailable if there are bookings or status is not available
        const isAvailable = (bookings.length === 0) &&
            (['available', 'active', 'vacant'].includes(roomStatus));
        res.json({
            status: 'success',
            data: {
                is_available: isAvailable,
                room_status: roomStatus,
                has_bookings: bookings.length > 0
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkRoomAvailability = checkRoomAvailability;
// Get all bookings (admin access)
const getAllBookings = async (req, res, next) => {
    var _a, _b;
    try {
        // Parse query parameters
        const status = req.query.status;
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '20');
        const offset = (page - 1) * limit;
        // Check if user is admin
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_type;
        // Only super_admin can access all bookings
        if (userType !== 'admin' || userRole !== 'super_admin') {
            return next(new error_middleware_1.AppError('Unauthorized. Super admin access required.', 403));
        }
        // Build the query dynamically based on filters
        let query = `
      SELECT b.*, 
             hr.title as room_title, hr.room_number,
             h.id as homestay_id, h.title as homestay_title
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
    `;
        const queryParams = [];
        let whereConditions = [];
        // Add filters
        if (status) {
            whereConditions.push(`b.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }
        if (startDate) {
            whereConditions.push(`b.start_date >= $${queryParams.length + 1}`);
            queryParams.push(startDate);
        }
        if (endDate) {
            whereConditions.push(`b.end_date <= $${queryParams.length + 1}`);
            queryParams.push(endDate);
        }
        // Add WHERE clause if there are conditions
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        // Add ORDER BY and pagination
        query += ` ORDER BY b.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        // Execute query
        const { rows } = await database_1.pool.query(query, queryParams);
        // Get total count for pagination
        const countQuery = `
      SELECT COUNT(*) as total
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      ${whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : ''}
    `;
        const { rows: countResult } = await database_1.pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
        const total = parseInt(countResult[0].total);
        // Format the data
        const bookings = rows.map(row => {
            return {
                id: row.id,
                start_date: row.start_date,
                end_date: row.end_date,
                room_id: row.room_id,
                status: row.status,
                is_paid: row.is_paid,
                user_id: row.user_id,
                booking_number: row.booking_number,
                total_price: row.total_price,
                payment_method: row.payment_method,
                check_in_time: row.check_in_time,
                check_out_time: row.check_out_time,
                number_of_guests: row.number_of_guests,
                notes: row.notes,
                special_requests: row.special_requests,
                created_at: row.created_at,
                updated_at: row.updated_at,
                room: {
                    id: row.room_id,
                    title: row.room_title,
                    room_number: row.room_number
                },
                homestay: {
                    id: row.homestay_id,
                    title: row.homestay_title
                }
            };
        });
        res.json({
            status: 'success',
            data: bookings,
            meta: {
                total,
                page,
                limit
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllBookings = getAllBookings;
// Get bookings by owner
const getBookingsByOwner = async (req, res, next) => {
    try {
        const { ownerId } = req.params;
        // Parse query parameters for filtering
        const status = req.query.status;
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '20');
        const offset = (page - 1) * limit;
        console.log(`Getting bookings for owner: ${ownerId}`);
        // Build the query with LEFT JOIN to get user info
        let query = `
      SELECT b.*, 
             hr.title as room_title, hr.room_number,
             h.id as homestay_id, h.title as homestay_title, h.user_id as owner_id,
             u.name as guest_name, u.email as guest_email
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      LEFT JOIN "landing_page_user" u ON b.user_id = u.id
      WHERE h.user_id = $1
    `;
        const queryParams = [ownerId];
        // Add filters
        if (status) {
            query += ` AND b.status = $${queryParams.length + 1}`;
            queryParams.push(status);
        }
        if (startDate) {
            query += ` AND b.start_date >= $${queryParams.length + 1}`;
            queryParams.push(startDate);
        }
        if (endDate) {
            query += ` AND b.end_date <= $${queryParams.length + 1}`;
            queryParams.push(endDate);
        }
        // Add ORDER BY and pagination
        query += ` ORDER BY b.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);
        // Execute query
        const { rows } = await database_1.pool.query(query, queryParams);
        console.log(`Found ${rows.length} bookings for owner ${ownerId}`);
        // Get total count for pagination
        const countQuery = `
      SELECT COUNT(*) as total
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE h.user_id = $1
      ${status ? `AND b.status = $2` : ''}
      ${startDate ? `AND b.start_date >= $${status ? 2 : 1}` : ''}
      ${endDate ? `AND b.end_date <= $${status && startDate ? 3 : status || startDate ? 2 : 1}` : ''}
    `;
        const countParams = [ownerId];
        if (status)
            countParams.push(status);
        if (startDate)
            countParams.push(startDate);
        if (endDate)
            countParams.push(endDate);
        const { rows: countResult } = await database_1.pool.query(countQuery, countParams);
        const total = parseInt(countResult[0].total);
        // Format the data with proper guest info extraction
        const bookings = rows.map(row => {
            // Extract guest info from notes field if user_id is null
            let guestName = row.guest_name;
            let guestEmail = row.guest_email;
            let guestPhone = '';
            // If no user linked, try to extract from notes field
            if (!guestName && row.notes && row.notes.includes('Guest:')) {
                const guestInfo = row.notes.match(/Guest: ([^,]+), Email: ([^,]+), Phone: (.+?)(?:\n|$)/);
                if (guestInfo) {
                    guestName = guestInfo[1].trim();
                    guestEmail = guestInfo[2].trim();
                    guestPhone = guestInfo[3].trim();
                }
            }
            return {
                id: row.id,
                start_date: row.start_date,
                end_date: row.end_date,
                room_id: row.room_id,
                status: row.status,
                is_paid: row.is_paid,
                user_id: row.user_id,
                booking_number: row.booking_number,
                total_price: parseFloat(row.total_price), // Ensure numeric format
                payment_method: row.payment_method,
                check_in_time: row.check_in_time,
                check_out_time: row.check_out_time,
                number_of_guests: row.number_of_guests,
                notes: row.notes,
                special_requests: row.special_requests,
                created_at: row.created_at,
                updated_at: row.updated_at,
                // Frontend expects these fields
                guest_name: guestName || 'Guest',
                guest_email: guestEmail || '',
                guest_phone: guestPhone || '',
                // Also include check_in_date/check_out_date aliases for compatibility
                check_in_date: row.start_date,
                check_out_date: row.end_date,
                // Include total_amount as alias for total_price
                total_amount: parseFloat(row.total_price),
                room: {
                    id: row.room_id,
                    title: row.room_title,
                    room_number: row.room_number
                },
                homestay: {
                    id: row.homestay_id,
                    title: row.homestay_title
                }
            };
        });
        // Log sample booking structure for debugging
        if (bookings.length > 0) {
            console.log('Sample booking structure:', JSON.stringify(bookings[0], null, 2).substring(0, 500) + '...');
        }
        res.status(200).json({
            status: 'success',
            data: bookings,
            meta: {
                total,
                page,
                limit,
                owner_id: ownerId
            }
        });
    }
    catch (error) {
        console.error('Error in getBookingsByOwner:', error);
        next(error);
    }
};
exports.getBookingsByOwner = getBookingsByOwner;
// Get bookings by homestay
const getBookingsByHomestay = async (req, res, next) => {
    try {
        const { homestayId } = req.params;
        const { rows } = await database_1.pool.query(`SELECT b.*, 
        hr.title as room_title, hr.room_number,
        h.title as homestay_title, h.id as homestay_id
       FROM "booking" b
       JOIN "homestayRoom" hr ON b.room_id = hr.id
       JOIN "homestay" h ON hr.homestay_id = h.id
       WHERE h.id = $1
       ORDER BY b.created_at DESC`, [homestayId]);
        const bookings = rows;
        res.status(200).json({
            status: 'success',
            data: bookings
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBookingsByHomestay = getBookingsByHomestay;
