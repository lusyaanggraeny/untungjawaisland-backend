import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { HomestayCreateInput, HomestayUpdateInput, HomestayImageCreateInput } from '../types/homestay.types';
import { AppError } from '../middleware/error.middleware';

// Get all active homestays with owner name, images, and rooms
export const getAllHomestays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = `
      SELECT 
        h.*,
        u.name as owner_name,
        (
          SELECT json_agg(json_build_object('id', hi.id, 'img_url', hi.img_url, 'is_primary', hi.is_primary, 'order', hi."order"))
          FROM "homestayImages" hi 
          WHERE hi.homestay_id = h.id
        ) as images,
        (
          SELECT json_agg(json_build_object(
            'id', hr.id, 
            'title', hr.title, 
            'description', hr.description,
            'status', hr.status,
            'room_number', hr.room_number,
            'number_people', hr.number_people,
            'max_occupancy', hr.max_occupancy,
            'price', hr.price,
            'currency', hr.currency,
            'size', hr.size
            ))
          FROM "homestayRoom" hr 
          WHERE hr.homestay_id = h.id
        ) as rooms
      FROM "homestay" h 
      JOIN "admin_users" u ON h.user_id = u.id
      WHERE h.status = 'active'
      ORDER BY h.created_at DESC;
    `;
    const { rows: homestays } = await pool.query(query);

    res.json({
      status: 'success',
      data: homestays
    });
  } catch (error) {
    next(error);
  }
};

// Get a single homestay by ID with owner name, images, and rooms (including room features)
export const getHomestayById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        h.*,
        u.name as owner_name,
        (
          SELECT json_agg(json_build_object('id', hi.id, 'img_url', hi.img_url, 'is_primary', hi.is_primary, 'order', hi."order"))
          FROM "homestayImages" hi 
          WHERE hi.homestay_id = h.id
        ) as images,
        (
          SELECT json_agg(json_build_object(
            'id', hr.id, 
            'title', hr.title, 
            'description', hr.description,
            'status', hr.status,
            'room_number', hr.room_number,
            'number_people', hr.number_people,
            'max_occupancy', hr.max_occupancy,
            'price', hr.price,
            'currency', hr.currency,
            'size', hr.size,
            'features', (
              SELECT json_agg(json_build_object(
                'id', rf.id,
                'title', rf.title,
                'description', rf.description,
                'symbol', rf.symbol,
                'category', rf.category
              ))
              FROM "room_features" rf
              JOIN "relation_feature_room" rfr ON rf.id = rfr.room_feature_id
              WHERE rfr.homestay_id = hr.id -- This should be rfr.room_id = hr.id if relation_feature_room.homestay_id means room_id
                                          -- The schema says relation_feature_room.homestay_id FK to homestayRoom.id, so it means room_id.
            )
          ))
          FROM "homestayRoom" hr 
          WHERE hr.homestay_id = h.id
        ) as rooms
      FROM "homestay" h 
      JOIN "admin_users" u ON h.user_id = u.id 
      WHERE h.id = $1;
    `;
    const { rows: homestays } = await pool.query(query, [id]);

    if (homestays.length === 0) {
      return next(new AppError('Homestay not found', 404));
    }

    res.json({
      status: 'success',
      data: homestays[0]
    });
  } catch (error) {
    next(error);
  }
};

export const createHomestay = async (
  req: Request<{}, {}, HomestayCreateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      user_id, // This should be populated from authenticated user (e.g. req.user.id)
      status,
      has_rooms,
      location,
      address,
      base_price,
      max_guests,
      contact_number
    } = req.body;
    
    // const actual_user_id = req.user?.id; // Assuming req.user.id holds the admin_users id
    // if (!actual_user_id) {
    //   return next(new AppError('User not authenticated or user ID missing', 401));
    // }

    // For now, we'll use user_id from body, but it should come from req.user
    if (!user_id) {
        return next(new AppError('user_id is required to create a homestay', 400));
    }

    const { rows: [newHomestay] } = await pool.query(
      `INSERT INTO "homestay" (title, description, user_id, status, has_rooms, location, address, base_price, max_guests, contact_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, user_id, status ?? 'active', has_rooms ?? false, location, address, base_price, max_guests, contact_number]
    );
    
    // TODO: Handle image creation in "homestayImages" table separately if primary_image_url or multiple images are provided.

    res.status(201).json({
      status: 'success',
      data: newHomestay
    });
  } catch (error) {
    next(error);
  }
};

export const updateHomestay = async (
  req: Request<{ id: string }, {}, HomestayUpdateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const homestayId = parseInt(id, 10);
    if (isNaN(homestayId)) {
      return next(new AppError('Invalid homestay ID format', 400));
    }

    const {
      title,
      description,
      status,
      has_rooms,
      location,
      address,
      base_price,
      max_guests,
      contact_number
    } = req.body;
    
    const loggedInUserId = req.user?.id; // Assuming req.user.id holds the admin_users id

    // Check if homestay exists and (optionally) if it belongs to the user if not super_admin
    // For simplicity, this check assumes any authenticated admin user can update, or it's owned by them.
    // Proper authorization logic might be more complex (e.g. check role).
    const { rows: existingHomestays } = await pool.query(
      'SELECT * FROM "homestay" WHERE id = $1 AND user_id = $2', // only owner can update
      [homestayId, loggedInUserId]
    );

    if (existingHomestays.length === 0 && req.user?.role !== 'super_admin') { // allow super_admin to update any
        const { rows: anyHomestay } = await pool.query('SELECT * FROM "homestay" WHERE id = $1', [homestayId]);
        if (anyHomestay.length === 0) {
            return next(new AppError('Homestay not found', 404));
        }
        if (req.user?.role !== 'super_admin') {
             return next(new AppError('Unauthorized to update this homestay', 403));
    }
    }
     if (existingHomestays.length === 0 && req.user?.role === 'super_admin') {
      // Super admin is trying to update a homestay not owned by them, which is allowed.
      // We need to fetch the current values for COALESCE if the owner check failed.
      const { rows: currentHomestayResult } = await pool.query('SELECT * FROM "homestay" WHERE id = $1', [homestayId]);
      if (currentHomestayResult.length === 0) {
        return next(new AppError('Homestay not found', 404));
      }
    }

    const { rows: [updatedHomestay] } = await pool.query(
      `UPDATE "homestay" 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           has_rooms = COALESCE($4, has_rooms),
           location = COALESCE($5, location),
           address = COALESCE($6, address),
           base_price = COALESCE($7, base_price),
           max_guests = COALESCE($8, max_guests),
           contact_number = COALESCE($9, contact_number),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        title,
        description,
        status,
        has_rooms,
        location,
        address,
        base_price,
        max_guests,
        contact_number,
        homestayId
      ]
    );

    res.json({
      status: 'success',
      data: updatedHomestay
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHomestay = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const homestayId = parseInt(id, 10);
     if (isNaN(homestayId)) {
      return next(new AppError('Invalid homestay ID format', 400));
    }
    const loggedInUserId = req.user?.id; // Assuming req.user.id holds the admin_users id
    const userRole = req.user?.role;

    // Check if homestay exists
    const { rows: existingHomestays } = await pool.query(
      'SELECT * FROM "homestay" WHERE id = $1',
      [homestayId]
    );

    if (existingHomestays.length === 0) {
      return next(new AppError('Homestay not found', 404));
    }

    // Check for authorization: either owner or super_admin
    if (userRole !== 'super_admin' && existingHomestays[0].user_id !== loggedInUserId) {
      return next(new AppError('Unauthorized to delete this homestay', 403));
    }

    // TODO: Consider what happens to homestayRooms, bookings, reviews, images on deletion (CASCADE or SET NULL)
    // The schema uses ON DELETE CASCADE for homestayImages and homestayRoom.
    // Bookings referencing rooms of this homestay might need specific handling if not cascaded from rooms.
    // Reviews also have FKs that might cascade or need attention.

    await pool.query('DELETE FROM "homestay" WHERE id = $1', [homestayId]);

    res.json({
      status: 'success',
      message: 'Homestay deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// New function to add an image to a homestay
export const addHomestayImage = async (
  req: Request<{ homestayId: string }, {}, HomestayImageCreateInput>,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect(); // Use a client for transaction
  try {
    const { homestayId } = req.params;
    const { img_url, is_primary, order } = req.body;
    const loggedInUserId = req.user?.id;
    const userRole = req.user?.role;

    const homestayIdNum = parseInt(homestayId, 10);
    if (isNaN(homestayIdNum)) {
      return next(new AppError('Invalid homestay ID format', 400));
    }

    if (!img_url || typeof img_url !== 'string') {
      return next(new AppError('Image URL (img_url) is required and must be a string', 400));
    }

    // Check if homestay exists
    const { rows: existingHomestays } = await client.query(
      'SELECT user_id FROM "homestay" WHERE id = $1',
      [homestayIdNum]
    );

    if (existingHomestays.length === 0) {
      return next(new AppError('Homestay not found', 404));
    }

    // Authorization: Check if the logged-in user owns the homestay or is a super_admin
    if (userRole !== 'super_admin' && existingHomestays[0].user_id !== loggedInUserId) {
      return next(new AppError('Unauthorized to add images to this homestay', 403));
    }

    await client.query('BEGIN'); // Start transaction

    // If the new image is primary, set other images for this homestay to not be primary
    if (is_primary === true) {
      await client.query(
        'UPDATE "homestayImages" SET is_primary = false WHERE homestay_id = $1 AND is_primary = true',
        [homestayIdNum]
      );
    }

    // Insert the new image
    const { rows: [newImage] } = await client.query(
      `INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [homestayIdNum, img_url, is_primary ?? false, order ?? 0]
    );

    await client.query('COMMIT'); // Commit transaction

    res.status(201).json({
      status: 'success',
      data: newImage
    });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    next(error);
  } finally {
    client.release(); // Release client back to the pool
  }
}; 