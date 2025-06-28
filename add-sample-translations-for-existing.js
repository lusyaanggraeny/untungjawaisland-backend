// Quick script to add Indonesian translations for existing homestays and rooms

const { Pool } = require('pg');
require('dotenv').config();

// Use the same database configuration as your app
const connectionString = process.env.DB_CONNECTION_STRING;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

async function addTranslationsForExisting() {
  console.log('🌍 Adding Indonesian translations for existing homestays and rooms...\n');
  
  try {
    // 1. Get existing homestays
    console.log('📝 Checking existing homestays...');
    const { rows: homestays } = await pool.query('SELECT id, title, description FROM "homestay" LIMIT 10');
    console.log(`Found ${homestays.length} homestays`);
    
    // 2. Add Indonesian translations for existing homestays
    for (const homestay of homestays) {
      const indonesianTitle = `${homestay.title} (Indonesia)`;
      const indonesianDescription = `Deskripsi dalam bahasa Indonesia untuk ${homestay.title}. Homestay yang nyaman dengan fasilitas lengkap untuk liburan yang tak terlupakan.`;
      
      try {
        await pool.query(
          `INSERT INTO "homestay_translations" (homestay_id, language_code, title, description) 
           VALUES ($1, 'id', $2, $3) 
           ON CONFLICT (homestay_id, language_code) DO UPDATE SET 
           title = EXCLUDED.title, description = EXCLUDED.description`,
          [homestay.id, indonesianTitle, indonesianDescription]
        );
        console.log(`✅ Added Indonesian translation for homestay ${homestay.id}: "${indonesianTitle}"`);
      } catch (error) {
        console.log(`⚠️  Skipped homestay ${homestay.id}: ${error.message}`);
      }
    }
    
    // 3. Get existing rooms
    console.log('\n📝 Checking existing rooms...');
    const { rows: rooms } = await pool.query('SELECT id, title, description FROM "homestayRoom" LIMIT 10');
    console.log(`Found ${rooms.length} rooms`);
    
    // 4. Add Indonesian translations for existing rooms
    for (const room of rooms) {
      const indonesianTitle = room.title.includes('Standard') ? 'Kamar Standard' :
                             room.title.includes('Deluxe') ? 'Kamar Deluxe' :
                             room.title.includes('Family') ? 'Kamar Keluarga' :
                             room.title.includes('Suite') ? 'Suite' :
                             `${room.title} (Indonesia)`;
      
      const indonesianDescription = `Deskripsi dalam bahasa Indonesia untuk ${room.title}. Kamar yang nyaman dengan fasilitas lengkap dan pemandangan yang indah.`;
      
      try {
        await pool.query(
          `INSERT INTO "room_translations" (room_id, language_code, title, description) 
           VALUES ($1, 'id', $2, $3) 
           ON CONFLICT (room_id, language_code) DO UPDATE SET 
           title = EXCLUDED.title, description = EXCLUDED.description`,
          [room.id, indonesianTitle, indonesianDescription]
        );
        console.log(`✅ Added Indonesian translation for room ${room.id}: "${indonesianTitle}"`);
      } catch (error) {
        console.log(`⚠️  Skipped room ${room.id}: ${error.message}`);
      }
    }
    
    // 5. Verify translations were added
    console.log('\n🔍 Verifying translations...');
    const { rows: [homestayCount] } = await pool.query('SELECT COUNT(*) as count FROM "homestay_translations" WHERE language_code = \'id\'');
    const { rows: [roomCount] } = await pool.query('SELECT COUNT(*) as count FROM "room_translations" WHERE language_code = \'id\'');
    
    console.log(`📊 Indonesian translations added:`);
    console.log(`   - Homestays: ${homestayCount.count}`);
    console.log(`   - Rooms: ${roomCount.count}`);
    
    console.log('\n🎉 Translations added successfully!');
    console.log('\nNow test the API with:');
    console.log('- http://localhost:5000/api/homestays/50?lang=id');
    console.log('- http://localhost:5000/api/rooms/10?lang=id');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addTranslationsForExisting(); 