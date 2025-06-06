const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'homestay_booking',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password'
});

async function quickFix() {
  try {
    console.log('🔧 QUICK FIX: Updating room 11 status...');
    
    // 1. Update room status to available
    await pool.query(
      'UPDATE "homestayRoom" SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['available', 11]
    );
    console.log('✅ Room 11 status updated to available');
    
    // 2. Check current bookings
    const { rows: bookings } = await pool.query(
      'SELECT id, start_date, end_date, status FROM "booking" WHERE room_id = 11 ORDER BY start_date DESC LIMIT 5'
    );
    
    console.log('📅 Recent bookings for room 11:');
    bookings.forEach(b => {
      console.log(`   - Booking ${b.id}: ${b.start_date} to ${b.end_date} (${b.status})`);
    });
    
    // 3. Test availability for June 7-8
    console.log('\n🧪 Testing availability for June 7-8...');
    const testStart = '2025-06-07';
    const testEnd = '2025-06-08';
    
    const { rows: conflicts } = await pool.query(
      `SELECT id, start_date, end_date, status 
       FROM "booking" 
       WHERE room_id = 11 
       AND status IN ('confirmed', 'pending', 'checked_in')
       AND start_date < $2 AND end_date > $1`,
      [testStart, testEnd]
    );
    
    if (conflicts.length === 0) {
      console.log('✅ NO CONFLICTS - Room should be available for June 7-8!');
    } else {
      console.log('❌ CONFLICTS FOUND:');
      conflicts.forEach(c => {
        console.log(`   - Booking ${c.id}: ${c.start_date} to ${c.end_date} (${c.status})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

quickFix(); 