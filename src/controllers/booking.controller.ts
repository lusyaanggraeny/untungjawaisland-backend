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
import { AdminJwtPayload, UserJwtPayload, AdminUserRole, UserRole } from '../types/user.types';
import moment from 'moment';

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
    // Enhanced logic to handle same-day bookings with early checkout
    try {
      // Use string comparison for dates to avoid timezone issues
      const requestStartDate = start_date; // Already in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]; // Get today in YYYY-MM-DD format
      
      // Check if booking is for today's date
      const isBookingForToday = requestStartDate === today;
      
      console.log(`[BOOKING] Request date: ${requestStartDate}, Today: ${today}`);
      console.log(`[BOOKING] Is booking for today: ${isBookingForToday}`);
      console.log(`[BOOKING] Checking availability for room ${room_id}, dates: ${start_date} to ${end_date}`);

      if (isBookingForToday) {
        // Use same availability logic as /same-day-availability endpoint
        console.log(`[BOOKING] Using same-day availability logic...`);
        
        // Check for active bookings (confirmed/pending) today
        const { rows: activeBookings } = await client.query(
          `SELECT * FROM "booking" 
           WHERE room_id = $1 
             AND status IN ($2, $3)
             AND start_date <= $4 
             AND end_date >= $4`,
          [room_id, BookingStatus.CONFIRMED, BookingStatus.PENDING, start_date]
        );

        if (activeBookings.length > 0) {
          console.log(`[BOOKING] ❌ Room has active booking for today`);
          return next(new AppError('Room is not available for the selected dates', 400));
        }

        // Check for completed bookings today (early checkout scenario)
        const { rows: completedToday } = await client.query(
          `SELECT * FROM "booking" 
           WHERE room_id = $1 
             AND status = $2
             AND start_date <= $3 
             AND end_date >= $3
             AND updated_at::date = $3::date
           ORDER BY updated_at DESC`,
          [room_id, BookingStatus.COMPLETED, start_date]
        );

        if (completedToday.length > 0) {
          const latestCheckout = completedToday[0];
          const checkoutTime = new Date(latestCheckout.updated_at);
          const housekeepingCompleteTime = new Date(checkoutTime.getTime() + (2 * 60 * 60 * 1000));
          const now = new Date();
          
          console.log(`[BOOKING] Early checkout detected - checkout: ${checkoutTime.toISOString()}`);
          console.log(`[BOOKING] Housekeeping complete time: ${housekeepingCompleteTime.toISOString()}`);
          
          if (now >= housekeepingCompleteTime) {
            console.log(`[BOOKING] ✅ Same-day booking allowed - housekeeping completed`);
          } else {
            const minutesLeft = Math.ceil((housekeepingCompleteTime.getTime() - now.getTime()) / (1000 * 60));
            console.log(`[BOOKING] ❌ Same-day booking denied - housekeeping in progress (${minutesLeft} minutes left)`);
            return next(new AppError(`Room will be available after housekeeping completion in ${minutesLeft} minutes`, 400));
          }
        } else {
          console.log(`[BOOKING] ✅ Same-day booking allowed - no bookings today`);
        }
      } else {
        // Use normal availability check for future dates with moment.js
        console.log(`[BOOKING] Using normal availability logic for future date...`);
        
        const requestStart = moment(start_date).startOf('day');
        const requestEnd = moment(end_date).startOf('day');
        
        // Get all active bookings for this room
        const { rows: allBookings } = await client.query(
          `SELECT id, start_date, end_date, status, booking_number 
           FROM "booking" 
           WHERE room_id = $1 
           AND status IN ($2, $3)`,
          [room_id, BookingStatus.CONFIRMED, BookingStatus.PENDING]
        );

        // Check for conflicts using same logic as availability endpoint
        let hasConflict = false;
        let conflictingBooking = null;
        
        for (const booking of allBookings) {
          const bookingStart = moment(booking.start_date).startOf('day');
          const bookingEnd = moment(booking.end_date).startOf('day');
          
          // FRONTEND TEAM'S FIX: Checkout date is EXCLUSIVE
          const conflicts = requestStart.isBefore(bookingEnd) && requestEnd.isAfter(bookingStart);
          
          console.log(`[BOOKING] Checking booking ${booking.id}:`, {
            bookingDates: `${bookingStart.format('YYYY-MM-DD')} to ${bookingEnd.format('YYYY-MM-DD')}`,
            requestDates: `${requestStart.format('YYYY-MM-DD')} to ${requestEnd.format('YYYY-MM-DD')}`,
            conflicts: conflicts
          });
          
          if (conflicts) {
            hasConflict = true;
            conflictingBooking = booking;
            break;
          }
        }

        if (hasConflict) {
          console.log(`[BOOKING] ❌ Room not available for dates ${start_date} to ${end_date}`);
          console.log(`[BOOKING] Conflicting with booking ${conflictingBooking.id}`);
          return next(new AppError('Room is not available for the selected dates', 400));
        }
        
        console.log(`[BOOKING] ✅ Room available for dates ${start_date} to ${end_date}`);
      }

      // Availability logic complete - no additional checks needed
    } catch (availabilityError) {
      console.error(`[BOOKING] Error during availability check:`, availabilityError);
      throw availabilityError; // Re-throw to be caught by main try-catch
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
    const { rows } = await pool.query(
      `SELECT b.*, 
        hr.title as room_title, hr.room_number,
        h.title as homestay_title, h.id as homestay_id
       FROM "booking" b
       JOIN "homestayRoom" hr ON b.room_id = hr.id
       JOIN "homestay" h ON hr.homestay_id = h.id
       WHERE b.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    const booking: BookingWithRelations = rows[0];
    res.status(200).json({
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
    
    // Check if the requesting user is authenticated
    const user = req.user as any; // Use any to handle both types
    if (!user || !user.id) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user is admin (from admin_users table) or landing page user
    const isAdmin = 'role' in user && Object.values(AdminUserRole).includes(user.role as AdminUserRole);
    const isLandingUser = user.user_type === 'landing_user' || user.type === 'user';

    if (!isAdmin && !isLandingUser) {
      return next(new AppError('Invalid user type', 403));
    }

    // Landing page users can only view their own bookings unless they're admins
    if (isLandingUser && userIdParam !== user.id) {
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

// Get current user's bookings
export const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if the user is authenticated
    const user = req.user as any; // Use any to handle both types
    if (!user || !user.id) {
      return next(new AppError('User not authenticated', 401));
    }

    // Convert user ID to number for database query
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    if (isNaN(userId)) {
      return next(new AppError('Invalid user ID', 400));
    }

    // Get all bookings for the authenticated user with related data
    const { rows } = await pool.query(
      `SELECT 
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
      ORDER BY b.created_at DESC`,
      [userId]
    );
    
    res.json({
      status: 'success',
      results: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error in getMyBookings:', error);
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

    // Validate status
    if (!Object.values(BookingStatus).includes(status)) {
      return next(new AppError('Invalid booking status', 400));
    }

    // Get the booking with room and homestay details
    const { rows } = await client.query(
      `SELECT b.*, 
              hr.title as room_title, hr.room_number,
              h.id as homestay_id, h.title as homestay_title, h.user_id as owner_id
       FROM "booking" b
       JOIN "homestayRoom" hr ON b.room_id = hr.id
       JOIN "homestay" h ON hr.homestay_id = h.id
       WHERE b.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    const booking = rows[0];

    // Check authorization
    const user = req.user as any; // Use any to handle both types
    if (!user || !user.id) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user is admin (from admin_users table) or landing page user
    const isAdmin = 'role' in user && Object.values(AdminUserRole).includes(user.role as AdminUserRole);
    const isLandingUser = user.user_type === 'landing_user' || user.type === 'user';

    if (!isAdmin && !isLandingUser) {
      return next(new AppError('Invalid user type', 403));
    }

    // Only allow status updates if:
    // 1. User is the booking owner (landing page user) - but they can only cancel
    // 2. User is an admin
    if (isLandingUser && booking.user_id !== user.id) {
      return next(new AppError('Not authorized to update this booking', 403));
    }

    if (isLandingUser && status !== BookingStatus.CANCELLED) {
      return next(new AppError('Regular users can only cancel bookings', 403));
    }

    // Store the old status for comparison
    const oldStatus = booking.status;

    // Update the booking status
    const updateResult = await client.query(
      `UPDATE "booking" 
       SET status = $1, 
           cancellation_reason = $2,
           cancelled_at = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [
        status,
        cancellation_reason || null,
        status === BookingStatus.CANCELLED ? new Date() : null,
        id
      ]
    );

    // Update room status based on booking status change
    if (status === BookingStatus.COMPLETED && oldStatus !== BookingStatus.COMPLETED) {
      // Booking completed - room becomes available (early checkout scenario)
      await client.query(
        `UPDATE "homestayRoom" 
         SET status = 'available', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [booking.room_id]
      );
      console.log(`[BOOKING] Room ${booking.room_id} marked as available after booking ${id} completion`);
      
    } else if (status === BookingStatus.CANCELLED && oldStatus !== BookingStatus.CANCELLED) {
      // Booking cancelled - room becomes available
      await client.query(
        `UPDATE "homestayRoom" 
         SET status = 'available', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [booking.room_id]
      );
      console.log(`[BOOKING] Room ${booking.room_id} marked as available after booking ${id} cancellation`);
      
    } else if (status === BookingStatus.CONFIRMED && oldStatus !== BookingStatus.CONFIRMED) {
      // Booking confirmed - room becomes occupied
      await client.query(
        `UPDATE "homestayRoom" 
         SET status = 'occupied', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [booking.room_id]
      );
      console.log(`[BOOKING] Room ${booking.room_id} marked as occupied after booking ${id} confirmation`);
    }

    await client.query('COMMIT');

    // Send email notification for status update
    try {
      let customerEmail = '';
      let customerName = '';
      
      // Check if this is an authenticated user booking or guest booking
      if (booking.user_id) {
        // Get authenticated user details
        const { rows: userRows } = await pool.query(
          'SELECT name, email FROM "landing_page_user" WHERE id = $1',
          [booking.user_id]
        );
        
        if (userRows.length > 0) {
          customerEmail = userRows[0].email;
          customerName = userRows[0].name;
        }
      } else {
        // Parse guest information from notes field
        const notesMatch = booking.notes?.match(/Guest: ([^,]+), Email: ([^,]+), Phone: (.+)/);
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
        await sendBookingStatusUpdate(customerEmail, {
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
    } catch (emailError) {
      // Don't fail the request if email sending fails
      console.error('Error sending status update email:', emailError);
    }

    res.status(200).json({
      status: 'success',
      data: updateResult.rows[0]
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
    console.log('[GUEST-BOOKING] Starting guest booking creation...');
    console.log('[GUEST-BOOKING] Request body:', req.body);
    
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

    console.log('[GUEST-BOOKING] Validating required fields...');
    
    // Validate required guest information
    if (!guest_name || !guest_email || !guest_phone) {
      console.log('[GUEST-BOOKING] ❌ Missing guest information');
      return next(new AppError('Guest name, email, and phone are required', 400));
    }

    // Validate required booking fields
    if (!start_date || !end_date || !room_id || !number_of_guests) {
      console.log('[GUEST-BOOKING] ❌ Missing booking information');
      return next(new AppError('Start date, end date, room ID and number of guests are required', 400));
    }

    console.log('[GUEST-BOOKING] Fetching room information...');
    
    // Verify room exists and is available
    const { rows: roomRows } = await client.query(
      'SELECT hr.*, h.base_price, h.title as homestay_title FROM "homestayRoom" hr JOIN "homestay" h ON hr.homestay_id = h.id WHERE hr.id = $1',
      [room_id]
    );

    if (roomRows.length === 0) {
      console.log('[GUEST-BOOKING] ❌ Room not found');
      return next(new AppError('Room not found', 404));
    }

    const room = roomRows[0];
    console.log('[GUEST-BOOKING] Room found:', room.title);

    // Check if room is available for the requested dates
    // Enhanced logic to handle same-day bookings with early checkout
    // Use string comparison for dates to avoid timezone issues
    const requestStartDate = start_date; // Already in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]; // Get today in YYYY-MM-DD format
    
    // Check if booking is for today's date
    const isBookingForToday = requestStartDate === today;

    console.log(`[GUEST-BOOKING] Request date: ${requestStartDate}, Today: ${today}`);
    console.log(`[GUEST-BOOKING] Is booking for today: ${isBookingForToday}`);
    console.log(`[GUEST-BOOKING] Checking availability for room ${room_id}, dates: ${start_date} to ${end_date}`);

    if (isBookingForToday) {
      // Use same availability logic as /same-day-availability endpoint
      console.log(`[GUEST-BOOKING] Using same-day availability logic...`);
      
      // Check for active bookings (confirmed/pending) today
      const { rows: activeBookings } = await client.query(
        `SELECT * FROM "booking" 
         WHERE room_id = $1 
           AND status IN ($2, $3)
           AND start_date <= $4 
           AND end_date >= $4`,
        [room_id, BookingStatus.CONFIRMED, BookingStatus.PENDING, start_date]
      );

      if (activeBookings.length > 0) {
        console.log(`[GUEST-BOOKING] ❌ Room has active booking for today`);
        return next(new AppError('Room is not available for the selected dates', 400));
      }

      // Check for completed bookings today (early checkout scenario)
      const { rows: completedToday } = await client.query(
        `SELECT * FROM "booking" 
         WHERE room_id = $1 
           AND status = $2
           AND start_date <= $3 
           AND end_date >= $3
           AND updated_at::date = $3::date
         ORDER BY updated_at DESC`,
        [room_id, BookingStatus.COMPLETED, start_date]
      );

      if (completedToday.length > 0) {
        const latestCheckout = completedToday[0];
        const checkoutTime = new Date(latestCheckout.updated_at);
        const housekeepingCompleteTime = new Date(checkoutTime.getTime() + (2 * 60 * 60 * 1000));
        const now = new Date();
        
        console.log(`[GUEST-BOOKING] Early checkout detected - checkout: ${checkoutTime.toISOString()}`);
        console.log(`[GUEST-BOOKING] Housekeeping complete time: ${housekeepingCompleteTime.toISOString()}`);
        
        if (now >= housekeepingCompleteTime) {
          console.log(`[GUEST-BOOKING] ✅ Same-day booking allowed - housekeeping completed`);
        } else {
          const minutesLeft = Math.ceil((housekeepingCompleteTime.getTime() - now.getTime()) / (1000 * 60));
          console.log(`[GUEST-BOOKING] ❌ Same-day booking denied - housekeeping in progress (${minutesLeft} minutes left)`);
          return next(new AppError(`Room will be available after housekeeping completion in ${minutesLeft} minutes`, 400));
        }
      } else {
        console.log(`[GUEST-BOOKING] ✅ Same-day booking allowed - no bookings today`);
      }
    } else {
      // Use normal availability check for future dates with moment.js
      console.log(`[GUEST-BOOKING] Using normal availability logic for future date...`);
      
      const requestStart = moment(start_date).startOf('day');
      const requestEnd = moment(end_date).startOf('day');
      
      // Get all active bookings for this room
      const { rows: allBookings } = await client.query(
        `SELECT id, start_date, end_date, status, booking_number 
         FROM "booking" 
         WHERE room_id = $1 
         AND status IN ($2, $3)`,
        [room_id, BookingStatus.CONFIRMED, BookingStatus.PENDING]
      );

      // Check for conflicts using same logic as availability endpoint
      let hasConflict = false;
      let conflictingBooking = null;
      
      for (const booking of allBookings) {
        const bookingStart = moment(booking.start_date).startOf('day');
        const bookingEnd = moment(booking.end_date).startOf('day');
        
        // FRONTEND TEAM'S FIX: Checkout date is EXCLUSIVE
        const conflicts = requestStart.isBefore(bookingEnd) && requestEnd.isAfter(bookingStart);
        
        console.log(`[GUEST-BOOKING] Checking booking ${booking.id}:`, {
          bookingDates: `${bookingStart.format('YYYY-MM-DD')} to ${bookingEnd.format('YYYY-MM-DD')}`,
          requestDates: `${requestStart.format('YYYY-MM-DD')} to ${requestEnd.format('YYYY-MM-DD')}`,
          conflicts: conflicts
        });
        
        if (conflicts) {
          hasConflict = true;
          conflictingBooking = booking;
          break;
        }
      }

      if (hasConflict) {
        console.log(`[GUEST-BOOKING] ❌ Room not available for dates ${start_date} to ${end_date}`);
        console.log(`[GUEST-BOOKING] Conflicting with booking ${conflictingBooking.id}`);
        return next(new AppError('Room is not available for the selected dates', 400));
      }
      
      console.log(`[GUEST-BOOKING] ✅ Room available for dates ${start_date} to ${end_date}`);
    }

    console.log('[GUEST-BOOKING] Calculating price...');
    
    // Calculate total price
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    // For same-day bookings, consider it as 1 night
    const actualNights = nights <= 0 ? 1 : nights;
    
    console.log(`[GUEST-BOOKING] Date calculation: ${start_date} to ${end_date} = ${nights} days, treating as ${actualNights} night(s)`);
    
    if (startDate > endDate) {
      console.log('[GUEST-BOOKING] ❌ Invalid date range - start date after end date');
      return next(new AppError('Start date cannot be after end date', 400));
    }

    const totalPrice = room.price * actualNights;
    const bookingNumber = generateBookingNumber();

    console.log(`[GUEST-BOOKING] Calculated: ${actualNights} nights x ${room.price} = ${totalPrice}`);

    // Store guest info in notes field
    const guestInfo = `Guest: ${guest_name}, Email: ${guest_email}, Phone: ${guest_phone}`;
    const combinedNotes = notes ? `${notes}\n\n${guestInfo}` : guestInfo;

    console.log('[GUEST-BOOKING] Creating booking record...');

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

    console.log('[GUEST-BOOKING] Booking created with ID:', newBooking.id);

    // IMPORTANT: Update the room status to occupied
    await client.query(
      `UPDATE "homestayRoom" SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [room_id]
    );
    
    console.log(`[GUEST-BOOKING] Room ${room_id} status updated to occupied for guest booking ${newBooking.id}`);

    await client.query('COMMIT');
    console.log('[GUEST-BOOKING] Transaction committed successfully');

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
    } catch (emailError) {
      // Don't fail the request if email sending fails
      console.error('Error sending guest booking emails:', emailError);
    }

    console.log('[GUEST-BOOKING] ✅ Guest booking completed successfully');

    res.status(201).json({
      status: 'success',
      data: bookingWithDetails
    });
  } catch (error) {
    console.error('[GUEST-BOOKING] ❌ Error occurred:', error);
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

    const roomIdNum = parseInt(roomId, 10);
    if (isNaN(roomIdNum)) {
      return next(new AppError('Invalid room ID', 400));
    }

    console.log(`[SIMPLE-CHECK] Room ${roomIdNum}, dates: ${start_date} to ${end_date}`);

    // Get room info
    const { rows: roomRows } = await pool.query(
      'SELECT * FROM "homestayRoom" WHERE id = $1',
      [roomIdNum]
    );

    if (roomRows.length === 0) {
      return next(new AppError('Room not found', 404));
    }

    // Get ALL bookings for this room (for comprehensive analysis)
    const { rows: allBookings } = await pool.query(
      `SELECT id, start_date, end_date, status, booking_number 
       FROM "booking" 
       WHERE room_id = $1 
       AND status IN ('confirmed', 'pending')
       ORDER BY start_date ASC`,
      [roomIdNum]
    );

    // Check for conflicts with the requested dates
    const { rows: conflictingBookings } = await pool.query(
      `SELECT id, start_date, end_date, status 
       FROM "booking" 
       WHERE room_id = $1 
       AND status IN ('confirmed', 'pending')
       AND NOT (end_date <= $2 OR start_date >= $3)`,
      [roomIdNum, start_date, end_date]
    );

    console.log(`[SIMPLE-CHECK] Found ${conflictingBookings.length} conflicting bookings`);
    
    const isAvailable = conflictingBookings.length === 0;
    
    // Auto-fix room status
    if (isAvailable) {
      await pool.query(
        'UPDATE "homestayRoom" SET status = $1 WHERE id = $2',
        ['available', roomIdNum]
      );
    }

    // Helper function to format dates consistently
    const formatDate = (date: any): string => {
      return new Date(date).toISOString().split('T')[0];
    };

    // Format booking for response
    const formatBookingForResponse = (booking: any) => {
      if (!booking) return null;
      return {
        ...booking,
        start_date: formatDate(booking.start_date),
        end_date: formatDate(booking.end_date)
      };
    };

    // ✅ SMART NEXT AVAILABLE DATE LOGIC
    let nextAvailableDate = null;
    
    if (!isAvailable && conflictingBookings.length > 0) {
      // If there's a conflict, find the next truly available date
      const conflictEnd = new Date(conflictingBookings[0].end_date);
      const searchStart = new Date(conflictEnd.getTime() + 24 * 60 * 60 * 1000); // Day after conflict ends
      
      // Search for next available period (check next 30 days)
      let foundAvailable = false;
      for (let i = 0; i < 30 && !foundAvailable; i++) {
        const checkDate = new Date(searchStart.getTime() + i * 24 * 60 * 60 * 1000);
        const checkEnd = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
        
        // Check if this date has conflicts with any booking
        const hasConflictOnDate = allBookings.some(booking => {
          const bookingStart = new Date(booking.start_date);
          const bookingEnd = new Date(booking.end_date);
          return checkDate < bookingEnd && checkEnd > bookingStart;
        });
        
        if (!hasConflictOnDate) {
          nextAvailableDate = formatDate(checkDate);
          foundAvailable = true;
        }
      }
    }
    // If isAvailable is true, nextAvailableDate stays null (room is available now!)

    // Response with corrected logic
    res.json({
      status: 'success',
      data: {
        is_available: isAvailable,
        room_status: isAvailable ? 'available' : 'occupied',
        has_bookings: allBookings.length > 0,
        current_booking: formatBookingForResponse(conflictingBookings[0]),
        next_available_date: nextAvailableDate, // ✅ FIXED: Only set when there's actual conflict
        upcoming_bookings: allBookings.slice(0, 3).map(formatBookingForResponse)
      }
    });
    
  } catch (error) {
    console.error('[SIMPLE-CHECK] Error:', error);
    next(error);
  }
};

// Get all bookings for a specific room
export const getRoomBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = req.params;
    const { start_date, end_date, include_cancelled } = req.query;

    // Validate room ID
    const roomIdNum = parseInt(roomId, 10);
    if (isNaN(roomIdNum)) {
      return next(new AppError('Invalid room ID', 400));
    }

    // Check if room exists
    const { rows: roomRows } = await pool.query(
      'SELECT id FROM "homestayRoom" WHERE id = $1',
      [roomIdNum]
    );

    if (roomRows.length === 0) {
      return next(new AppError('Room not found', 404));
    }

    // Build query with optional filters
    let query = `
      SELECT b.id, b.booking_number, b.start_date, b.end_date, b.status, 
             b.number_of_guests, b.user_id, b.notes,
             u.name as guest_name
      FROM "booking" b
      LEFT JOIN "landing_page_user" u ON b.user_id = u.id
      WHERE b.room_id = $1
    `;
    
    const queryParams: any[] = [roomIdNum];
    
    // Add status filter (exclude cancelled by default)
    if (include_cancelled !== 'true') {
      query += ` AND b.status != $${queryParams.length + 1}`;
      queryParams.push(BookingStatus.CANCELLED);
    }
    
    // Add date filters
    if (start_date) {
      query += ` AND b.end_date >= $${queryParams.length + 1}`;
      queryParams.push(start_date);
    }
    
    if (end_date) {
      query += ` AND b.start_date <= $${queryParams.length + 1}`;
      queryParams.push(end_date);
    }
    
    query += ' ORDER BY b.start_date ASC';
    
    const { rows } = await pool.query(query, queryParams);
    
    // Format response data
    const bookings = rows.map(row => {
      let guestName = row.guest_name;
      
      // If no user_id, try to extract guest name from notes
      if (!row.user_id && row.notes) {
        const notesMatch = row.notes.match(/Guest: ([^,]+)/);
        if (notesMatch) {
          guestName = notesMatch[1];
        }
      }
      
      return {
        id: row.id,
        booking_number: row.booking_number,
        start_date: new Date(row.start_date).toISOString().split('T')[0],
        end_date: new Date(row.end_date).toISOString().split('T')[0],
        status: row.status,
        number_of_guests: row.number_of_guests,
        guest_name: guestName,
        user_id: row.user_id
      };
    });
    
    res.json({
      status: 'success',
      data: bookings
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

// Get bookings by owner
export const getBookingsByOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ownerId } = req.params;
    
    // Parse query parameters for filtering
    const status = req.query.status as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
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
    
    const queryParams: any[] = [ownerId];
    
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
    const { rows } = await pool.query(query, queryParams);
    
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
    if (status) countParams.push(status);
    if (startDate) countParams.push(startDate);
    if (endDate) countParams.push(endDate);
    
    const { rows: countResult } = await pool.query(countQuery, countParams);
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
  } catch (error) {
    console.error('Error in getBookingsByOwner:', error);
    next(error);
  }
};

// Get bookings by homestay
export const getBookingsByHomestay = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { homestayId } = req.params;
    const { rows } = await pool.query(
      `SELECT b.*, 
        hr.title as room_title, hr.room_number,
        h.title as homestay_title, h.id as homestay_id
       FROM "booking" b
       JOIN "homestayRoom" hr ON b.room_id = hr.id
       JOIN "homestay" h ON hr.homestay_id = h.id
       WHERE h.id = $1
       ORDER BY b.created_at DESC`,
      [homestayId]
    );

    const bookings: BookingWithRelations[] = rows;
    res.status(200).json({
      status: 'success',
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// Check same-day availability (handles early checkout scenarios)
export const checkSameDayAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = req.params;
    const queryDate = req.query.date as string;
    
    // Use provided date or today's date
    const checkDate = queryDate || new Date().toISOString().split('T')[0];
    
    console.log(`[BOOKING] Same-day availability check for room ${roomId} on ${checkDate}`);
    
    // Validate room ID
    const roomIdNum = parseInt(roomId, 10);
    if (isNaN(roomIdNum)) {
      return next(new AppError('Invalid room ID', 400));
    }

    // Check if room exists
    const { rows: roomRows } = await pool.query(
      'SELECT id FROM "homestayRoom" WHERE id = $1',
      [roomIdNum]
    );

    if (roomRows.length === 0) {
      return next(new AppError('Room not found', 404));
    }

    // Get all bookings for this room on the specified date
    const { rows: bookings } = await pool.query(
      `SELECT b.*, 
              EXTRACT(EPOCH FROM (b.updated_at AT TIME ZONE 'UTC')) as updated_timestamp
       FROM "booking" b
       WHERE b.room_id = $1 
         AND b.start_date <= $2 
         AND b.end_date >= $2
       ORDER BY b.updated_at DESC`,
      [roomIdNum, checkDate]
    );

    console.log(`[BOOKING] Found ${bookings.length} bookings for room ${roomIdNum} on ${checkDate}`);

    // Separate bookings by status
    const completedToday = bookings.filter(booking => {
      const isCompleted = booking.status === BookingStatus.COMPLETED;
      const updatedToday = new Date(booking.updated_at).toISOString().split('T')[0] === checkDate;
      return isCompleted && updatedToday;
    });

    const activeBookings = bookings.filter(booking => 
      [BookingStatus.CONFIRMED, BookingStatus.PENDING].includes(booking.status)
    );

    console.log(`[BOOKING] ${completedToday.length} completed today, ${activeBookings.length} active bookings`);

    // Scenario 1: Room has active bookings (occupied)
    if (activeBookings.length > 0) {
      const currentBooking = activeBookings[0];
      const endTime = new Date(currentBooking.end_date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return res.json({
        status: 'success',
        data: {
          is_available: false,
          early_checkout: false,
          current_booking: {
            id: currentBooking.id,
            booking_number: currentBooking.booking_number,
            end_date: new Date(currentBooking.end_date).toISOString().split('T')[0], // Format as YYYY-MM-DD
            status: currentBooking.status
          },
          earliest_booking_time: endTime,
          message: 'Room is currently occupied',
          can_book_today: false
        }
      });
    }

    // Scenario 2: Room had early checkout (completed booking today)
    if (completedToday.length > 0) {
      const latestCheckout = completedToday[0]; // Already ordered by updated_at DESC
      const checkoutTime = new Date(latestCheckout.updated_at);
      
      // Calculate housekeeping completion time (2 hours after checkout)
      const housekeepingCompleteTime = new Date(checkoutTime.getTime() + (2 * 60 * 60 * 1000));
      const now = new Date();
      const isHousekeepingComplete = now >= housekeepingCompleteTime;
      
      const checkoutTimeString = checkoutTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const housekeepingTimeString = housekeepingCompleteTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return res.json({
        status: 'success',
        data: {
          is_available: true,
          early_checkout: true,
          checkout_time: checkoutTimeString,
          housekeeping_status: isHousekeepingComplete ? 'completed' : 'in_progress',
          housekeeping_complete_time: housekeepingTimeString,
          earliest_booking_time: isHousekeepingComplete ? 'now' : housekeepingTimeString,
          can_book_today: true,
          message: isHousekeepingComplete 
            ? 'Room available after early checkout - housekeeping completed'
            : `Room will be available after housekeeping completion at ${housekeepingTimeString}`,
          previous_booking: {
            id: latestCheckout.id,
            booking_number: latestCheckout.booking_number,
            checkout_time: checkoutTimeString
          }
        }
      });
    }

    // Scenario 3: No bookings for today (room is available)
    return res.json({
      status: 'success',
      data: {
        is_available: true,
        early_checkout: false,
        earliest_booking_time: 'now',
        can_book_today: true,
        message: 'Room is available for same-day booking'
      }
    });

  } catch (error) {
    console.error('[BOOKING] Same-day availability check failed:', error);
    next(error);
  }
}; 