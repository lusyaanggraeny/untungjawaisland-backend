import { pool } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runTranslationMigration() {
  console.log('🚀 Starting translation tables migration...');
  
  try {
    // Read and execute the main migration file
    const migrationPath = path.join(__dirname, '../database/migrations/add_translation_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Creating translation tables...');
    await pool.query(migrationSQL);
    console.log('✅ Translation tables created successfully!');
    
    // Read and execute sample data (optional)
    const sampleDataPath = path.join(__dirname, '../database/migrations/add_sample_translations.sql');
    if (fs.existsSync(sampleDataPath)) {
      const sampleDataSQL = fs.readFileSync(sampleDataPath, 'utf8');
      
      console.log('📝 Adding sample translation data...');
      try {
        await pool.query(sampleDataSQL);
        console.log('✅ Sample translation data added successfully!');
      } catch (error: any) {
        console.log('⚠️  Sample data insertion failed (this is normal if data already exists):', error.message);
      }
    }
    
    // Verify migration success
    console.log('🔍 Verifying migration...');
    const verificationQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('homestay_translations', 'room_translations')
      AND table_schema = 'public';
    `;
    
    const { rows: tables } = await pool.query(verificationQuery);
    console.log('📊 Created tables:', tables.map(t => t.table_name));
    
    // Check translation counts
    const { rows: [homestayCount] } = await pool.query('SELECT COUNT(*) as count FROM "homestay_translations"');
    const { rows: [roomCount] } = await pool.query('SELECT COUNT(*) as count FROM "room_translations"');
    
    console.log(`📈 Translation records created:`);
    console.log(`   - Homestay translations: ${homestayCount.count}`);
    console.log(`   - Room translations: ${roomCount.count}`);
    
    console.log('🎉 Translation migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runTranslationMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runTranslationMigration }; 