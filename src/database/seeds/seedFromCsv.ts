import fs from 'fs';
import path from 'path';
import { pool } from '../../config/database';
import { HomestayCreateInput, HomestayImageCreateInput } from '../../types/homestay.types';
import bcrypt from 'bcryptjs';

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// A simple CSV parser
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r\n|\n/); // Handle both \n and \r\n
  if (lines.length < 2) {
    console.log('CSV Parser: Not enough lines (header + data).');
    return [];
  }
  const header = lines[0].split(',').map(h => h.trim());
  const data = [];
  const facilitiesColumnIndex = header.indexOf('Facilities');

  for (let i = 1; i < lines.length; i++) {
    // Skip empty lines
    if (lines[i].trim() === '') {
      continue;
    }
    let values = lines[i].split(',').map(v => v.trim());

    // Attempt to handle extra commas, likely in the Facilities column
    if (values.length > header.length && facilitiesColumnIndex !== -1) {
      const partsBeforeFacilities = values.slice(0, facilitiesColumnIndex);
      const partsAfterFacilitiesExpectedEnd = values.slice(values.length - (header.length - 1 - facilitiesColumnIndex));
      const facilitiesParts = values.slice(facilitiesColumnIndex, values.length - (header.length - 1 - facilitiesColumnIndex));
      
      if (facilitiesParts.length > 0) {
        const reconstructedFacilities = facilitiesParts.join(', ').trim(); // Re-join with comma and space
        values = [
          ...partsBeforeFacilities,
          reconstructedFacilities,
          ...partsAfterFacilitiesExpectedEnd
        ];
      }
    }

    if (values.length === header.length) {
      const row: Record<string, string> = {};
      let hasEssentialData = false;
      header.forEach((key, index) => {
        row[key] = values[index];
        if ((key === 'Name of Homestay' && values[index]) || (key === 'Link images for download' && values[index])) {
          hasEssentialData = true;
        }
      });
      // Skip row if it's just empty commas or lacks essential data
      if (hasEssentialData && values.some(val => val !== '')) {
        data.push(row);
      } else {
        console.log('CSV Parser: Skipping row due to lack of essential data or all empty values:', lines[i]);
      }
    } else {
      console.log('CSV Parser: Skipping row due to mismatched column count:', lines[i], 'Header count:', header.length, 'Values count:', values.length);
    }
  }
  if (data.length === 0) {
    console.log('CSV Parser: No data rows were successfully parsed. Header was:', header);
  }
  return data;
}

function parsePrice(priceString: string): number | null {
  if (!priceString) return null;
  const match = priceString.match(/([\d\.]+)/);
  return match ? parseFloat(match[1].replace(/\./g, '')) : null;
}

function parseRooms(roomString: string): { numRooms: number | null, isWholeHome: boolean } {
  if (!roomString) return { numRooms: null, isWholeHome: false };
  
  let numRooms: number | null = null;
  let isWholeHome = false;

  const homeMatch = roomString.match(/(\d+)\s*HOME(?:\s*\((\d+)\s*ROOM\))?/i);
  if (homeMatch) {
    isWholeHome = true;
    numRooms = homeMatch[2] ? parseInt(homeMatch[2], 10) : (homeMatch[1] ? parseInt(homeMatch[1],10) : null); // If (X ROOM) use X, else use number of homes as rooms
  } else {
    const roomMatch = roomString.match(/(\d+)\s*ROOM/i);
    if (roomMatch) {
      numRooms = parseInt(roomMatch[1], 10);
    }
  }
  return { numRooms, isWholeHome };
}

async function ensureDefaultAdminExists(client: any) {
  const DEFAULT_ADMIN_ID = 1;
  const checkAdmin = await client.query('SELECT id FROM admin_users WHERE id = $1', [DEFAULT_ADMIN_ID]);

  if (checkAdmin.rows.length === 0) {
    console.log(`Admin user with ID ${DEFAULT_ADMIN_ID} not found. Creating default admin...`);
    const username = 'admin_rusli';
    const email = 'rusli@example.com';
    const password = 'DefaultPassword123!'; // You should change this
    const hashedPassword = bcrypt.hashSync(password, 10);
    const fullName = 'Mr. Rusli (Default Admin)';
    const role = 'super_admin';
    const status = 'active';

    await client.query(
      `INSERT INTO admin_users (id, username, email, password_hash, full_name, role, status, created_at, updated_at, last_login)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NULL) ON CONFLICT (id) DO NOTHING`,
      [DEFAULT_ADMIN_ID, username, email, hashedPassword, fullName, role, status]
    );
    console.log(`Default admin user "${username}" created with ID ${DEFAULT_ADMIN_ID}.`);
  } else {
    console.log(`Admin user with ID ${DEFAULT_ADMIN_ID} already exists.`);
  }
}

async function ensureOwnerUsers(client: any, ownerNames: string[], superAdminId: number): Promise<Record<string, number>> {
  const ownerMap: Record<string, number> = {};
  for (const ownerName of ownerNames) {
    if (!ownerName || ownerName.trim() === '') continue;
    // Check if user exists
    const check = await client.query('SELECT id FROM admin_users WHERE name = $1', [ownerName]);
    if (check.rows.length > 0) {
      ownerMap[ownerName] = check.rows[0].id;
      continue;
    }
    // Create new user
    const username = slugify(ownerName);
    const email = `${username}@dummy.com`;
    const password = 'DefaultPassword123!';
    const hashedPassword = bcrypt.hashSync(password, 10);
    const role = 'homestay_owner';
    const is_active = true;
    const insert = await client.query(
      `INSERT INTO admin_users (username, password, email, name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
      [username, hashedPassword, email, ownerName, role, is_active]
    );
    ownerMap[ownerName] = insert.rows[0].id;
    console.log(`Created admin user for owner: ${ownerName} (username: ${username})`);
  }
  return ownerMap;
}

async function seedFromCSV() {
  const client = await pool.connect();
  const SUPER_ADMIN_ID = 1;

  try {
    await ensureDefaultAdminExists(client);
    await client.query('BEGIN');

    const csvFilePath = path.join(__dirname, '../../../IMAGES OF UNTUNG JAWA ISLAND - Sheet1.csv');
    const csvData = fs.readFileSync(csvFilePath, 'utf-8');
    const parsedRows = parseCSV(csvData);
    if (parsedRows.length === 0) {
      console.log('No valid data found in CSV or CSV is empty/malformed.');
      await client.query('ROLLBACK');
      return;
    }

    // Collect unique owner names
    const ownerNames = Array.from(new Set(parsedRows.map(row => row["Name's Owner"]).filter(Boolean)));
    const ownerMap = await ensureOwnerUsers(client, ownerNames, SUPER_ADMIN_ID);

    console.log(`Found ${parsedRows.length} potential homestays in the CSV file. Processing...`);
    let SUCESSFUL_INSERTS = 0;

    for (const row of parsedRows) {
      const title = row['Name of Homestay'];
      const imageLink = row['Link images for download'];
      if (!title || !imageLink) {
        console.warn('Skipping row due to missing title or image link:', row);
        continue;
      }
      const priceValue = parsePrice(row['Price']);
      const { numRooms, isWholeHome } = parseRooms(row['Number of Rooms']);
      // Assign user_id based on owner name, fallback to super admin
      let user_id = SUPER_ADMIN_ID;
      if (row["Name's Owner"] && ownerMap[row["Name's Owner"]]) {
        user_id = ownerMap[row["Name's Owner"]];
      }
      const homestayInput: HomestayCreateInput = {
        title: title,
        user_id: user_id,
        status: 'active',
        has_rooms: numRooms !== null && numRooms > 0,
        location: row['Address'] || 'Untung Jawa Island',
        address: row['Address'] || 'Details not specified',
        base_price: priceValue,
        max_guests: null,
        contact_number: null, // Not in CSV, set to null
        category: row['Category'] || null,
        description: `Facilities: ${row['Facilities'] || 'Not specified'}. Rooms: ${row['Number of Rooms'] || 'N/A'}. Owner: ${row["Name's Owner"] || 'N/A'}.`,
      };
      try {
        const homestayRes = await client.query(
          `INSERT INTO homestay (title, description, user_id, status, has_rooms, location, address, base_price, max_guests, contact_number, category, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
           RETURNING id`,
          [
            homestayInput.title,
            homestayInput.description,
            homestayInput.user_id,
            homestayInput.status,
            homestayInput.has_rooms,
            homestayInput.location,
            homestayInput.address,
            homestayInput.base_price,
            homestayInput.max_guests,
            homestayInput.contact_number,
            homestayInput.category,
          ]
        );
        const homestayId = homestayRes.rows[0].id;
        const imageInput: HomestayImageCreateInput = {
          img_url: imageLink,
          is_primary: true,
          order: 1
        };
        await client.query(
          `INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order", created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [homestayId, imageInput.img_url, imageInput.is_primary, imageInput.order]
        );
        SUCESSFUL_INSERTS++;
        console.log(`Successfully seeded homestay: ${homestayInput.title}`);
      } catch (dbError) {
        console.error(`Error inserting homestay "${title}":`, dbError);
        console.error('Row data:', row);
        throw dbError;
      }
    }
    await client.query('COMMIT');
    console.log(`${SUCESSFUL_INSERTS} homestays and their primary images seeded successfully from CSV.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding data from CSV, transaction rolled back:', error);
  } finally {
    client.release();
  }
}

seedFromCSV().then(() => {
  console.log('Finished seeding from CSV.');
  pool.end(); 
}).catch(err => {
  console.error('Unhandled error in seedFromCSV process:', err);
  pool.end(); 
}); 