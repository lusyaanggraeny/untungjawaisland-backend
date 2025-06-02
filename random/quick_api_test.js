const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

async function quickTest() {
  try {
    const client = await pool.connect();
    
    console.log('🔍 TESTING FINAL API QUERY...\n');
    
    // Test the exact query used by the API
    const query = `
      SELECT b.*, 
             hr.title as room_title, hr.room_number,
             h.id as homestay_id, h.title as homestay_title, h.user_id as owner_id,
             u.name as guest_name, u.email as guest_email
      FROM "booking" b
      JOIN "homestayRoom" hr ON b.room_id = hr.id
      JOIN "homestay" h ON hr.homestay_id = h.id
      LEFT JOIN "landing_page_user" u ON b.user_id = u.id
      WHERE h.user_id = $1
      ORDER BY b.created_at DESC 
      LIMIT 1
    `;
    
    const { rows } = await client.query(query, [13]);
    
    if (rows.length > 0) {
      const row = rows[0];
      
      // Apply the formatting logic from the controller
      let guestName = row.guest_name;
      let guestEmail = row.guest_email;
      let guestPhone = '';
      
      if (!guestName && row.notes && row.notes.includes('Guest:')) {
        const guestInfo = row.notes.match(/Guest: ([^,]+), Email: ([^,]+), Phone: (.+?)(?:\n|$)/);
        if (guestInfo) {
          guestName = guestInfo[1].trim();
          guestEmail = guestInfo[2].trim();
          guestPhone = guestInfo[3].trim();
        }
      }
      
      const formattedBooking = {
        id: row.id,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        total_price: parseFloat(row.total_price),
        guest_name: guestName || 'Guest',
        guest_email: guestEmail || '',
        guest_phone: guestPhone || '',
        homestay_id: row.homestay_id,
        created_at: row.created_at,
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
      
      console.log('✅ API Response Format:');
      console.log(JSON.stringify(formattedBooking, null, 2));
      
      // Count total for owner 13
      const countQuery = await client.query(`
        SELECT COUNT(*) as total
        FROM "booking" b
        JOIN "homestayRoom" hr ON b.room_id = hr.id
        JOIN "homestay" h ON hr.homestay_id = h.id
        WHERE h.user_id = 13
      `);
      
      console.log(`\n📊 Total bookings for owner 13: ${countQuery.rows[0].total}`);
      
      // Revenue calculation
      const revenueQuery = await client.query(`
        SELECT 
          SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END) as revenue,
          COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_count
        FROM "booking" b
        JOIN "homestayRoom" hr ON b.room_id = hr.id
        JOIN "homestay" h ON hr.homestay_id = h.id
        WHERE h.user_id = 13
      `);
      
      const stats = revenueQuery.rows[0];
      console.log(`💰 Completed Revenue: ${stats.revenue} IDR (${stats.completed_count} bookings)`);
      
    } else {
      console.log('❌ No bookings found for owner 13');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎯 Test complete! Check your admin dashboard now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest(); 