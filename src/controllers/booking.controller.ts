import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { 
  Booking, 
  BookingCreateInput, 
  BookingStatus,
  BookingStatusUpdateInput, 
  BookingWithRelations 
} from '../types/booking.types';
import { AppError } from '../middleware/error.middleware';

// Generate a unique booking number
const generateBookingNumber = (): string => {
  const prefix = 'BK';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

// Create a new booking
export const createBooking = async (
  req: Request<{}, {}, BookingCreateInput>,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      start_date,
      end_date,
      room_id,
      number_of_guests,
      special_requests,
      notes,
      check_in_time,
      check_out_time,
      payment_method
    } = req.body;

    // Validate required fields
    if (!start_date || !end_date || !room_id || !number_of_guests) {
      return next(new AppError('Start date, end date, room ID and number of guests are required', 400));
    }

    // Get user ID from the token
    const userId = req.user?.id;
    const isLandingUser = req.user?.user_type === 'landing_user';

    // Verify user exists if landing user
    if (isLandingUser && userId) {
      const { rows } = await client.query(
        'SELECT id FROM "landing_page_user" WHERE id = $1',
        [userId]
      );
      
      if (rows.length === 0) {
        return next(new AppError('User not found', 404));
      }
    }

    // Verify room exists and is available
    const { rows: roomRows } = await client.query(
      'SELECT hr.*, h.base_price, h.title as homestay_title FROM "homestayRoom" hr JOIN "homestay" h ON hr.homestay_id = h.id WHERE hr.id = $1',
      [room_id]
    );

    if (roomRows.length === 0) {
      return next(new AppError('Room not found', 404));
    }

    const room = roomRows[0];

    // Check if room is available for the requested dates
    const { rows: existingBookings } = await client.query(
      `SELECT * FROM "booking" 
       WHERE room_id = $1 
       AND status != $2
       AND (
         (start_date <= $3 AND end_date >= $3) OR
         (start_date <= $4 AND end_date >= $4) OR
         (start_date >= $3 AND end_date <= $4)
       )`,
      [room_id, BookingStatus.CANCELLED, start_date, end_date]
    );

    if (existingBookings.length > 0) {
      return next(new AppError('Room is not available for the selected dates', 400));
    }

    // Calculate total price
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    if (nights <= 0) {
      return next(new AppError('End date must be after start date', 400));
    }

    const totalPrice = room.price * nights;
    const bookingNumber = generateBookingNumber();

    // Create the booking
    const { rows: [newBooking] } = await client.query(
      `INSERT INTO "booking" (
        start_date, end_date, room_id, status, is_paid, user_id, 
        booking_number, total_price, payment_method, check_in_time, 
        check_out_time, number_of_guests, notes, special_requests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        start_date, 
        end_date, 
        room_id, 
        BookingStatus.PENDING, 
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
      ]
    );

    await client.query('COMMIT');

    // Return room and homestay details along with the booking
    const bookingWithDetails = {
      ...newBooking,
      room: {
        id: room.id,
        title: room.title,
        room_number: room.room_number
      },
      homestay: {
        id: room.homestay_id,
        title: room.homestay_title
      }
    };

    res.status(201).json({
      status: 'success',
      data: bookingWithDetails
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// Get booking by ID
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id, 10);

    if (isNaN(bookingId)) {
      return next(new AppError('Invalid booking ID', 400));
    }

    // Get booking with related data
    const { rows } = await pool.query(
      `SELECT 
        b.*,
        json_build_object(
          'id', hr.id,
          'title', hr.title,
          'room_number', hr.room_number,
          'price', hr.price,
          'currency', hr.currency
        ) as room,
        json_build_object(
          'id', h.id,
          'title', h.title,
          'address', h.address,
          'contact_number', h.contact_number
        ) as homestay,
        CASE 
          WHEN b.user_id IS NOT NULL THEN
            json_build_object(
              'id', lpu.id,
              'name', lpu.name,
              'email', lpu.email,
              'phone_number', lpu.phone_number
            )
          ELSE NULL
        END as user
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      LEFT JOIN "landing_page_user" lpu ON b.user_id = lpu.id
      WHERE b.id = $1`,
      [bookingId]
    );

    if (rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if user is authorized to view this booking
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    const userRole = req.user?.role;
    
    const booking = rows[0];
    
    // Only allow access if:
    // 1. User is the booking owner (landing user)
    // 2. User is an admin
    // 3. User is the homestay owner
    if (
      userType === 'landing_user' && booking.user_id !== userId &&
      !(userType === 'admin' && (userRole === 'super_admin' || userRole === 'homestay_owner'))
    ) {
      return next(new AppError('Not authorized to access this booking', 403));
    }

    res.json({
      status: 'success',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Get all bookings for a user
export const getUserBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const userIdParam = parseInt(userId, 10);
    
    if (isNaN(userIdParam)) {
      return next(new AppError('Invalid user ID', 400));
    }
    
    // Check if the requesting user is authorized to view these bookings
    const requestingUserId = req.user?.id;
    const userType = req.user?.user_type;
    const userRole = req.user?.role;
    
    // Users can only view their own bookings unless they're admins
    if (
      userType === 'landing_user' && userIdParam !== requestingUserId &&
      !(userType === 'admin' && (userRole === 'super_admin' || userRole === 'homestay_owner'))
    ) {
      return next(new AppError('Not authorized to access these bookings', 403));
    }
    
    // Get all bookings for the user with related data
    const { rows } = await pool.query(
      `SELECT 
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
      ORDER BY b.created_at DESC`,
      [userIdParam]
    );
    
    res.json({
      status: 'success',
      results: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// Update booking status
export const updateBookingStatus = async (
  req: Request<{id: string}, {}, BookingStatusUpdateInput>,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, cancellation_reason } = req.body;
    const bookingId = parseInt(id, 10);
    
    if (isNaN(bookingId)) {
      return next(new AppError('Invalid booking ID', 400));
    }
    
    // Check if the booking exists
    const { rows } = await client.query(
      'SELECT * FROM "booking" WHERE id = $1',
      [bookingId]
    );
    
    if (rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }
    
    const booking = rows[0];
    
    // Check authorization
    const userId = req.user?.id;
    const userType = req.user?.user_type;
    const userRole = req.user?.role;
    
    // Only allow status updates if:
    // 1. User is the booking owner (landing user) - but they can only cancel
    // 2. User is an admin
    // 3. User is the homestay owner
    if (
      (userType === 'landing_user' && booking.user_id !== userId) ||
      (userType === 'landing_user' && status !== BookingStatus.CANCELLED)
    ) {
      if (!(userType === 'admin' && (userRole === 'super_admin' || userRole === 'homestay_owner'))) {
        return next(new AppError('Not authorized to update this booking', 403));
      }
    }
    
    // Update the booking status
    const updateFields = ['status = $1'];
    const updateValues = [status];
    let paramCount = 2;
    
    // Add cancellation details if status is CANCELLED
    if (status === BookingStatus.CANCELLED) {
      updateFields.push(`cancelled_at = CURRENT_TIMESTAMP`);
      
      if (cancellation_reason) {
        updateFields.push(`cancellation_reason = $${paramCount}`);
        updateValues.push(cancellation_reason);
        paramCount++;
      }
    }
    
    const updateQuery = `
      UPDATE "booking" 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    updateValues.push(bookingId);
    
    const { rows: updatedRows } = await client.query(updateQuery, updateValues);
    
    await client.query('COMMIT');
    
    res.json({
      status: 'success',
      data: updatedRows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}; 