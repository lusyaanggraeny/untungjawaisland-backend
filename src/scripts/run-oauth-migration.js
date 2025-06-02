const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runOAuthMigration() {
  const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
  });

  try {
    console.log('🚀 Starting OAuth migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/add_oauth_support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ OAuth migration completed successfully!');
    console.log('📝 Added the following:');
    console.log('   - OAuth columns to landing_page_user table');
    console.log('   - OAuth columns to admin_users table');
    console.log('   - oauth_sessions table');
    console.log('   - Indexes for performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runOAuthMigration(); 