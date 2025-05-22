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
import { 
  sendBookingConfirmation, 
  sendBookingNotificationToAdmin,
  sendBookingStatusUpdate
} from '../services/email.service';

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

    // IMPORTANT: Update the room status to occupied
    await client.query(
      `UPDATE "homestayRoom" SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [room_id]
    );
    
    console.log(`Room ${room_id} status updated to occupied for booking ${newBooking.id}`);

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

    // Get user details for email (if this is a landing user booking)
    if (isLandingUser && userId) {
      try {
        const { rows: userRows } = await pool.query(
          'SELECT name, email FROM "landing_page_user" WHERE id = $1',
          [userId]
        );
        
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
          await sendBookingConfirmation(user.email, {
            bookingNumber: bookingNumber,
            customerName: user.name,
            homestayName: room.homestay_title,
            roomName: room.title,
            checkInDate: formattedStartDate,
            checkOutDate: formattedEndDate,
            totalPrice: totalPrice,
            paymentStatus: 'Pending',
            bookingStatus: 'Pending',
            guestCount: number_of_guests,
            specialRequests: special_requests || ''
          }).catch(err => console.error('Error sending booking confirmation email:', err));
          
          // Get admin email (homestay owner or system admin)
          const { rows: adminRows } = await pool.query(
            `SELECT au.email FROM "admin_users" au 
             JOIN "homestay" h ON h.user_id = au.id 
             WHERE h.id = $1`,
            [room.homestay_id]
          );
          
          if (adminRows.length > 0) {
            // Send notification to homestay owner
            await sendBookingNotificationToAdmin(adminRows[0].email, {
              bookingNumber: bookingNumber,
              customerName: user.name,
              homestayName: room.homestay_title,
              roomName: room.title,
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
      } catch (emailError) {
        // Don't fail the request if email sending fails
        console.error('Error sending booking emails:', emailError);
      }
    }

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
    const oldStatus = booking.status;
    
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
    
    // If cancelling a booking, update room status back to available
    if (status === BookingStatus.CANCELLED && oldStatus !== BookingStatus.CANCELLED) {
      // Get room ID from the booking
      const roomId = booking.room_id;
      
      // Update room status to available
      await client.query(
        `UPDATE "homestayRoom" SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [roomId]
      );
      
      console.log(`Room ${roomId} status updated to available after booking ${bookingId} cancelled`);
    }
    
    await client.query('COMMIT');
    
    // Send email notification about booking status change
    try {
      // Get detailed information for the email
      const { rows: bookingDetailRows } = await pool.query(
        `SELECT 
          b.*,
          hr.title as room_title,
          h.title as homestay_title,
          CASE
            WHEN b.user_id IS NOT NULL THEN (
              SELECT json_build_object('name', lpu.name, 'email', lpu.email)
              FROM "landing_page_user" lpu
              WHERE lpu.id = b.user_id
            )
            ELSE NULL
          END as user_info
        FROM "booking" b
        JOIN "homestayRoom" hr ON b.room_id = hr.id
        JOIN "homestay" h ON hr.homestay_id = h.id
        WHERE b.id = $1`,
        [bookingId]
      );
      
      if (bookingDetailRows.length > 0) {
        const bookingDetails = bookingDetailRows[0];
        let customerEmail = '';
        let customerName = '';
        
        // Try to get customer email and name
        if (bookingDetails.user_info) {
          // Registered user
          customerEmail = bookingDetails.user_info.email;
          customerName = bookingDetails.user_info.name;
        } else {
          // Guest booking - try to extract email from notes
          const notesText = bookingDetails.notes || '';
          const emailMatch = notesText.match(/Email: ([^,]+)/);
          const nameMatch = notesText.match(/Guest: ([^,]+)/);
          
          if (emailMatch && emailMatch[1]) {
            customerEmail = emailMatch[1].trim();
          }
          
          if (nameMatch && nameMatch[1]) {
            customerName = nameMatch[1].trim();
          }
        }
        
        // Only send if we have an email
        if (customerEmail) {
          // Format dates for email
          const formattedStartDate = new Date(bookingDetails.start_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          const formattedEndDate = new Date(bookingDetails.end_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          // Send status update email
          await sendBookingStatusUpdate(
            customerEmail,
            {
              bookingNumber: bookingDetails.booking_number,
              customerName: customerName,
              homestayName: bookingDetails.homestay_title,
              roomName: bookingDetails.room_title,
              checkInDate: formattedStartDate,
              checkOutDate: formattedEndDate,
              totalPrice: bookingDetails.total_price,
              paymentStatus: bookingDetails.is_paid ? 'Paid' : 'Pending',
              bookingStatus: status,
              guestCount: bookingDetails.number_of_guests,
              specialRequests: bookingDetails.special_requests || ''
            },
            status
          ).catch(err => console.error('Error sending booking status update email:', err));
        }
      }
    } catch (emailError) {
      // Don't fail the request if email sending fails
      console.error('Error sending booking status update email:', emailError);
    }
    
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

// Create a guest booking (no authentication required)
export const createGuestBooking = async (
  req: Request,
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
      guest_name,
      guest_email,
      guest_phone,
      special_requests,
      notes,
      check_in_time,
      check_out_time,
      payment_method
    } = req.body;

    // Validate required guest information
    if (!guest_name || !guest_email || !guest_phone) {
      return next(new AppError('Guest name, email, and phone are required', 400));
    }

    // Validate required booking fields
    if (!start_date || !end_date || !room_id || !number_of_guests) {
      return next(new AppError('Start date, end date, room ID and number of guests are required', 400));
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

    // Store guest info in notes field
    const guestInfo = `Guest: ${guest_name}, Email: ${guest_email}, Phone: ${guest_phone}`;
    const combinedNotes = notes ? `${notes}\n\n${guestInfo}` : guestInfo;

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
        null, // No user_id for guest bookings
        bookingNumber,
        totalPrice,
        payment_method || null,
        check_in_time || null,
        check_out_time || null,
        number_of_guests,
        combinedNotes,
        special_requests || null
      ]
    );

    // IMPORTANT: Update the room status to occupied
    await client.query(
      `UPDATE "homestayRoom" SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [room_id]
    );
    
    console.log(`Room ${room_id} status updated to occupied for guest booking ${newBooking.id}`);

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
      },
      guest: {
        name: guest_name,
        email: guest_email,
        phone: guest_phone
      }
    };

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
      await sendBookingConfirmation(guest_email, {
        bookingNumber: bookingNumber,
        customerName: guest_name,
        homestayName: room.homestay_title,
        roomName: room.title,
        checkInDate: formattedStartDate,
        checkOutDate: formattedEndDate,
        totalPrice: totalPrice,
        paymentStatus: 'Pending',
        bookingStatus: 'Pending',
        guestCount: number_of_guests,
        specialRequests: special_requests || ''
      }).catch(err => console.error('Error sending guest booking confirmation email:', err));
      
      // Get admin email (homestay owner or system admin)
      const { rows: adminRows } = await pool.query(
        `SELECT au.email FROM "admin_users" au 
          JOIN "homestay" h ON h.user_id = au.id 
          WHERE h.id = $1`,
        [room.homestay_id]
      );
      
      if (adminRows.length > 0) {
        // Send notification to homestay owner with guest information
        await sendBookingNotificationToAdmin(adminRows[0].email, {
          bookingNumber: bookingNumber,
          customerName: guest_name,
          homestayName: room.homestay_title,
          roomName: room.title,
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
    } catch (emailError) {
      // Don't fail the request if email sending fails
      console.error('Error sending guest booking emails:', emailError);
    }

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

// Check room availability
export const checkRoomAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return next(new AppError('Start date and end date are required', 400));
    }

    // Validate room ID
    const roomIdNum = parseInt(roomId, 10);
    if (isNaN(roomIdNum)) {
      return next(new AppError('Invalid room ID', 400));
    }

    // Get the room's current status
    const { rows: roomRows } = await pool.query(
      'SELECT * FROM "homestayRoom" WHERE id = $1',
      [roomIdNum]
    );

    if (roomRows.length === 0) {
      return next(new AppError('Room not found', 404));
    }

    const room = roomRows[0];
    const roomStatus = room.status;

    // Check if any bookings exist for this room in the date range
    // IMPORTANT: Include PENDING bookings in this check
    const { rows: bookings } = await pool.query(
      `SELECT * FROM "booking" 
       WHERE room_id = $1 
       AND status != $2
       AND (
         (start_date <= $3 AND end_date >= $3) OR
         (start_date <= $4 AND end_date >= $4) OR
         (start_date >= $3 AND end_date <= $4)
       )`,
      [roomIdNum, BookingStatus.CANCELLED, start_date, end_date]
    );
    
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
  } catch (error) {
    next(error);
  }
};

// Get all bookings (admin access)
export const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse query parameters
    const status = req.query.status as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const offset = (page - 1) * limit;

    // Check if user is admin
    const userRole = req.user?.role;
    const userType = req.user?.user_type;
    
    // Only super_admin can access all bookings
    if (userType !== 'admin' || userRole !== 'super_admin') {
      return next(new AppError('Unauthorized. Super admin access required.', 403));
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
    
    const queryParams: any[] = [];
    let whereConditions: string[] = [];
    
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
    const { rows } = await pool.query(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      ${whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : ''}
    `;
    
    const { rows: countResult } = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
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
  } catch (error) {
    next(error);
  }
};

// Get bookings by owner ID
export const getBookingsByOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ownerId } = req.params;
    
    // Parse query parameters
    const status = req.query.status as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const offset = (page - 1) * limit;
    
    // Check if user is authorized
    const userRole = req.user?.role;
    const userType = req.user?.user_type;
    const userId = req.user?.id;
    
    // Only allow users to view their own bookings or super_admin to view any
    if (!(userType === 'admin' && userRole === 'super_admin') && userId !== parseInt(ownerId)) {
      return next(new AppError('Unauthorized. You can only view your own bookings.', 403));
    }
    
    // Build the query to get bookings for all homestays owned by this owner
    let query = `
      SELECT b.*, 
             hr.title as room_title, hr.room_number,
             h.id as homestay_id, h.title as homestay_title
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE h.user_id = $1
    `;
    
    const queryParams: any[] = [ownerId];
    let whereConditions: string[] = [];
    
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
    
    // Add additional WHERE conditions if there are any
    if (whereConditions.length > 0) {
      query += ' AND ' + whereConditions.join(' AND ');
    }
    
    // Add ORDER BY and pagination
    query += ` ORDER BY b.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    // Execute query
    const { rows } = await pool.query(query, queryParams);
    
    // Get total count for pagination
    const baseWhereClause = `WHERE h.user_id = $1`;
    const additionalWhere = whereConditions.length > 0 ? ' AND ' + whereConditions.join(' AND ') : '';
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      ${baseWhereClause}${additionalWhere}
    `;
    
    const { rows: countResult } = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
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
  } catch (error) {
    next(error);
  }
};

// Get bookings by homestay ID
export const getBookingsByHomestay = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { homestayId } = req.params;
    
    // Parse query parameters
    const status = req.query.status as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const offset = (page - 1) * limit;
    
    // Check if user is authorized to view bookings for this homestay
    const userRole = req.user?.role;
    const userType = req.user?.user_type;
    const userId = req.user?.id;
    
    // If not super_admin, verify the user is the owner of this homestay
    if (!(userType === 'admin' && userRole === 'super_admin')) {
      const { rows } = await pool.query('SELECT user_id FROM "homestay" WHERE id = $1', [homestayId]);
      
      if (rows.length === 0) {
        return next(new AppError('Homestay not found', 404));
      }
      
      const homestayOwnerId = rows[0].user_id;
      
      if (userId !== homestayOwnerId) {
        return next(new AppError('Unauthorized. You can only view bookings for your own homestays.', 403));
      }
    }
    
    // Build the query
    let query = `
      SELECT b.*, 
             hr.title as room_title, hr.room_number,
             h.id as homestay_id, h.title as homestay_title
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE h.id = $1
    `;
    
    const queryParams: any[] = [homestayId];
    let whereConditions: string[] = [];
    
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
    
    // Add additional WHERE conditions if there are any
    if (whereConditions.length > 0) {
      query += ' AND ' + whereConditions.join(' AND ');
    }
    
    // Add ORDER BY and pagination
    query += ` ORDER BY b.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    // Execute query
    const { rows } = await pool.query(query, queryParams);
    
    // Get total count for pagination
    const baseWhereClause = `WHERE h.id = $1`;
    const additionalWhere = whereConditions.length > 0 ? ' AND ' + whereConditions.join(' AND ') : '';
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      ${baseWhereClause}${additionalWhere}
    `;
    
    const { rows: countResult } = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
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
  } catch (error) {
    next(error);
  }
}; 