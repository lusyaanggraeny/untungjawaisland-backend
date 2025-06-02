const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestBookings() {
  try {
    const client = await pool.connect();
    
    console.log('Creating test bookings...');
    
    // First, let's check what homestays and rooms exist
    const homestays = await client.query('SELECT id, title, user_id FROM homestay ORDER BY id');
    console.log('Available homestays:', homestays.rows);
    
    const rooms = await client.query('SELECT id, title, homestay_id FROM homestayRoom ORDER BY id');
    console.log('Available rooms:', rooms.rows);
    
    const users = await client.query('SELECT id, name, email FROM landing_page_user ORDER BY id');
    console.log('Available users:', users.rows);
    
    // Create some test bookings if we have data
    if (rooms.rows.length > 0 && users.rows.length > 0) {
      const room = rooms.rows[0];
      const user = users.rows[0];
      
      // Create a test booking
      const booking = await client.query(
        `INSERT INTO "booking" (
          start_date, end_date, room_id, status, is_paid, user_id, 
          booking_number, total_price, number_of_guests, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          '2024-02-01', 
          '2024-02-03', 
          room.id, 
          'pending', 
          false, 
          user.id,
          'BK' + Date.now(),
          500000.00,
          2,
          'Test booking created by script'
        ]
      );
      
      console.log('Created test booking:', booking.rows[0]);
      
      // Create another booking for a different date
      const booking2 = await client.query(
        `INSERT INTO "booking" (
          start_date, end_date, room_id, status, is_paid, user_id, 
          booking_number, total_price, number_of_guests, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          '2024-02-10', 
          '2024-02-12', 
          room.id, 
          'confirmed', 
          true, 
          user.id,
          'BK' + (Date.now() + 1),
          750000.00,
          3,
          'Second test booking created by script'
        ]
      );
      
      console.log('Created second test booking:', booking2.rows[0]);
    } else {
      console.log('No rooms or users available to create test bookings');
    }
    
    // Now check bookings for owner 13
    console.log('\n=== CHECKING BOOKINGS FOR OWNER 13 ===');
    const ownerBookings = await client.query(`
      SELECT b.*, hr.title as room_title, h.title as homestay_title, h.user_id as owner_id
      FROM booking b
      JOIN homestayRoom hr ON b.room_id = hr.id
      JOIN homestay h ON hr.homestay_id = h.id
      WHERE h.user_id = 13
    `);
    console.log('Bookings for owner 13:', ownerBookings.rows);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error creating test bookings:', error);
  }
}

createTestBookings(); 