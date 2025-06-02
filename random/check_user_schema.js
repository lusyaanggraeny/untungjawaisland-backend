const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkUserSchema() {
  try {
    const client = await pool.connect();
    
    console.log('=== CHECKING USER TABLE SCHEMA ===\n');
    
    // Check landing_page_user table schema
    const userSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'landing_page_user'
      ORDER BY ordinal_position
    `);
    
    console.log('landing_page_user table columns:');
    userSchema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check sample user data
    console.log('\n=== SAMPLE USER DATA ===');
    const sampleUsers = await client.query('SELECT * FROM "landing_page_user" LIMIT 2');
    if (sampleUsers.rows.length > 0) {
      console.log('Sample user:', sampleUsers.rows[0]);
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserSchema(); 