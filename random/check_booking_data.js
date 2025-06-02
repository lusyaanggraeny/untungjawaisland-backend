const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkBookingData() {
  try {
    const client = await pool.connect();
    
    console.log('=== CHECKING BOOKING DATA STRUCTURE ===\n');
    
    // Check what bookings exist for owner 13
    const ownerBookings = await client.query(`
      SELECT 
        b.*,
        hr.title as room_title, 
        hr.room_number,
        h.id as homestay_id, 
        h.title as homestay_title, 
        h.user_id as owner_id
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE h.user_id = 13
      ORDER BY b.created_at DESC
      LIMIT 3
    `);
    
    console.log(`Found ${ownerBookings.rows.length} bookings for owner 13:`);
    
    if (ownerBookings.rows.length > 0) {
      console.log('\n=== FIRST BOOKING SAMPLE ===');
      const firstBooking = ownerBookings.rows[0];
      
      // Log all fields
      Object.keys(firstBooking).forEach(key => {
        console.log(`${key}: ${firstBooking[key]}`);
      });
      
      console.log('\n=== FORMATTED BOOKING ===');
      const formattedBooking = {
        id: firstBooking.id,
        start_date: firstBooking.start_date,
        end_date: firstBooking.end_date,
        room_id: firstBooking.room_id,
        status: firstBooking.status,
        is_paid: firstBooking.is_paid,
        user_id: firstBooking.user_id,
        booking_number: firstBooking.booking_number,
        total_price: firstBooking.total_price,
        number_of_guests: firstBooking.number_of_guests,
        notes: firstBooking.notes,
        created_at: firstBooking.created_at,
        room: {
          id: firstBooking.room_id,
          title: firstBooking.room_title,
          room_number: firstBooking.room_number
        },
        homestay: {
          id: firstBooking.homestay_id,
          title: firstBooking.homestay_title
        }
      };
      
      console.log(JSON.stringify(formattedBooking, null, 2));
      
      // Check if we have guest information in notes field
      if (firstBooking.notes && firstBooking.notes.includes('Guest:')) {
        console.log('\n=== GUEST INFO EXTRACTION ===');
        const guestInfo = firstBooking.notes.match(/Guest: ([^,]+), Email: ([^,]+), Phone: (.+?)(?:\n|$)/);
        if (guestInfo) {
          console.log('Guest Name:', guestInfo[1]);
          console.log('Guest Email:', guestInfo[2]);
          console.log('Guest Phone:', guestInfo[3]);
        }
      }
    }
    
    // Check total revenue calculation
    console.log('\n=== REVENUE CALCULATION ===');
    const revenueQuery = await client.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END) as completed_revenue,
        SUM(b.total_price) as total_revenue,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      WHERE h.user_id = 13
    `);
    
    const stats = revenueQuery.rows[0];
    console.log('Total Bookings:', stats.total_bookings);
    console.log('Completed Revenue:', stats.completed_revenue);
    console.log('Total Revenue:', stats.total_revenue);
    console.log('Completed Bookings:', stats.completed_bookings);
    console.log('Pending Bookings:', stats.pending_bookings);
    console.log('Confirmed Bookings:', stats.confirmed_bookings);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error checking booking data:', error);
  }
}

checkBookingData(); 