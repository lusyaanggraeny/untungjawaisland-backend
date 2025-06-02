require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool using the connection string from .env file
const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false // Required for Supabase or similar hosted services
  }
});

// Sample room types to add
const roomTypes = [
  {
    title: 'Standard Room',
    description: 'Comfortable standard room with all basic amenities',
    status: 'available',
    roomNumberPrefix: 'S',
    numberPeople: 2,
    maxOccupancy: 3,
    price: 300000.00,
    currency: 'IDR',
    size: '20m²'
  },
  {
    title: 'Deluxe Room',
    description: 'Spacious deluxe room with premium amenities and great view',
    status: 'available',
    roomNumberPrefix: 'D',
    numberPeople: 3,
    maxOccupancy: 4,
    price: 450000.00,
    currency: 'IDR',
    size: '30m²'
  },
  {
    title: 'Family Suite',
    description: 'Large family room with multiple beds and amenities for families',
    status: 'available',
    roomNumberPrefix: 'F',
    numberPeople: 4,
    maxOccupancy: 6,
    price: 600000.00,
    currency: 'IDR',
    size: '45m²'
  }
];

// Function to add rooms to all homestays
async function addRoomsToAllHomestays() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Get all active homestays
    const homestaysResult = await client.query('SELECT id, title FROM homestay WHERE status = $1', ['active']);
    const homestays = homestaysResult.rows;
    
    console.log(`Found ${homestays.length} active homestays`);
    
    if (homestays.length === 0) {
      console.log('No active homestays found. Please create homestays first.');
      return;
    }
    
    // Add rooms to each homestay
    let addedRooms = 0;
    
    for (const homestay of homestays) {
      console.log(`Adding rooms to homestay: ${homestay.title} (ID: ${homestay.id})`);
      
      for (let i = 0; i < roomTypes.length; i++) {
        const room = roomTypes[i];
        const roomNumber = `${room.roomNumberPrefix}-${homestay.id}-${i+1}`;
        
        // Insert the room
        const insertQuery = `
          INSERT INTO "homestayRoom" 
          (homestay_id, title, description, status, room_number, number_people, max_occupancy, price, currency, size)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `;
        
        const result = await client.query(insertQuery, [
          homestay.id,
          room.title,
          room.description,
          room.status,
          roomNumber,
          room.numberPeople,
          room.maxOccupancy,
          room.price,
          room.currency,
          room.size
        ]);
        
        const roomId = result.rows[0].id;
        console.log(`  - Added ${room.title} with ID ${roomId}`);
        addedRooms++;
      }
    }
    
    // Update homestay has_rooms flag
    await client.query('UPDATE homestay SET has_rooms = true WHERE id IN (SELECT DISTINCT homestay_id FROM "homestayRoom")');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`Successfully added ${addedRooms} rooms to ${homestays.length} homestays.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding rooms:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Add rooms to a specific homestay
async function addRoomsToHomestay(homestayId) {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if homestay exists
    const homestayResult = await client.query('SELECT id, title FROM homestay WHERE id = $1', [homestayId]);
    
    if (homestayResult.rows.length === 0) {
      console.log(`No homestay found with ID ${homestayId}`);
      return;
    }
    
    const homestay = homestayResult.rows[0];
    console.log(`Adding rooms to homestay: ${homestay.title} (ID: ${homestay.id})`);
    
    // Add rooms
    let addedRooms = 0;
    
    for (let i = 0; i < roomTypes.length; i++) {
      const room = roomTypes[i];
      const roomNumber = `${room.roomNumberPrefix}-${homestay.id}-${i+1}`;
      
      // Insert the room
      const insertQuery = `
        INSERT INTO "homestayRoom" 
        (homestay_id, title, description, status, room_number, number_people, max_occupancy, price, currency, size)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      
      const result = await client.query(insertQuery, [
        homestay.id,
        room.title,
        room.description,
        room.status,
        roomNumber,
        room.numberPeople,
        room.maxOccupancy,
        room.price,
        room.currency,
        room.size
      ]);
      
      const roomId = result.rows[0].id;
      console.log(`  - Added ${room.title} with ID ${roomId}`);
      addedRooms++;
    }
    
    // Update homestay has_rooms flag
    await client.query('UPDATE homestay SET has_rooms = true WHERE id = $1', [homestayId]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`Successfully added ${addedRooms} rooms to homestay ${homestay.title}.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding rooms:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // No arguments - add rooms to all homestays
  addRoomsToAllHomestays();
} else if (args.length === 1 && !isNaN(parseInt(args[0]))) {
  // One numeric argument - add rooms to specific homestay
  addRoomsToHomestay(parseInt(args[0]));
} else {
  console.log('Usage:');
  console.log('  node add_rooms.js            - Add rooms to all active homestays');
  console.log('  node add_rooms.js [ID]       - Add rooms to a specific homestay by ID');
} 