import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

const migrateQRISPayments = async () => {
  try {
    console.log('🚀 Starting QRIS payments migration...');

    // Read the migration SQL file
    const migrationFile = path.join(__dirname, '../../database/migrations/add-qris-payment-columns.sql');
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');

    // Split the SQL file into individual statements
    const statements = migrationSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log('✅ Executed migration statement successfully');
      } catch (error: any) {
        // Continue if column already exists
        if (error.message?.includes('already exists')) {
          console.log('⚠️  Column already exists, skipping...');
        } else {
          throw error;
        }
      }
    }

    console.log('✅ QRIS payments migration completed successfully!');
    console.log('📋 Added columns:');
    console.log('   - gateway_provider');
    console.log('   - gateway_payment_id');
    console.log('   - qris_code');
    console.log('   - qris_expires_at');
    console.log('   - platform_commission');
    console.log('   - owner_payout_amount');
    console.log('   - payout_status');
    console.log('   - confirmation_deadline');
    console.log('   - manual_confirmation_required');

  } catch (error) {
    console.error('❌ Error running QRIS migration:', error);
    throw error;
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateQRISPayments()
    .then(() => {
      console.log('🎉 Migration completed! You can now use QRIS payments.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default migrateQRISPayments; 