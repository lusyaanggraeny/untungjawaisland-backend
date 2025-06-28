"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHomestayImage = exports.deleteHomestay = exports.updateHomestay = exports.createHomestay = exports.getHomestayById = exports.getAllHomestays = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const translation_utils_1 = require("../utils/translation.utils");
// Get all active homestays with owner name, images, and rooms
const getAllHomestays = async (req, res, next) => {
    try {
        const lang = (0, translation_utils_1.validateLanguageCode)(req.query.lang);
        const query = `
      SELECT 
        h.*,
        u.name as owner_name,
        (
          SELECT json_agg(
            json_build_object('id', hi.id, 'img_url', hi.img_url, 'is_primary', hi.is_primary, 'order', hi."order")
            ORDER BY hi."order", hi.id
          )
          FROM "homestayImages" hi 
          WHERE hi.homestay_id = h.id
        ) as "homestayImages",
        (
          SELECT json_agg(json_build_object(
            'id', hr.id, 
            'room_id', hr.id,
            'title', hr.title, 
            'name', hr.title,
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
        ) as rooms,
        (
          SELECT json_agg(
            json_build_object(
              'language_code', ht.language_code,
              'title', ht.title,
              'description', ht.description
            )
          )
          FROM "homestay_translations" ht
          WHERE ht.homestay_id = h.id
        ) as translations
      FROM "homestay" h 
      JOIN "admin_users" u ON h.user_id = u.id
      WHERE h.status = 'active'
      ORDER BY h.created_at DESC;
    `;
        const { rows: homestays } = await database_1.pool.query(query);
        // 🚨 EXHIBITION FIX: Only use fallback if NO real images exist
        const fallbackImages = [
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1502780402662-acc01917615e?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1486304873000-235643847519?w=800&h=600&fit=crop'
        ];
        // Process homestays and apply translations
        const processedHomestays = [];
        // Get all room IDs for batch translation fetch
        const allRoomIds = [];
        homestays.forEach(homestay => {
            if (homestay.rooms && Array.isArray(homestay.rooms)) {
                homestay.rooms.forEach((room) => allRoomIds.push(room.id));
            }
        });
        // Fetch all room translations at once
        let roomTranslationsMap = {};
        if (allRoomIds.length > 0) {
            const roomTranslationsQuery = `
        SELECT room_id, language_code, title, description
        FROM "room_translations"
        WHERE room_id = ANY($1)
      `;
            const { rows: roomTranslations } = await database_1.pool.query(roomTranslationsQuery, [allRoomIds]);
            // Group translations by room_id
            roomTranslations.forEach(translation => {
                if (!roomTranslationsMap[translation.room_id]) {
                    roomTranslationsMap[translation.room_id] = [];
                }
                roomTranslationsMap[translation.room_id].push(translation);
            });
        }
        // Process each homestay
        for (const homestay of homestays) {
            // Only add fallback if database returned NULL (no images at all)
            if (homestay.homestayImages === null) {
                const imageIndex = homestay.id % fallbackImages.length;
                homestay.homestayImages = [{
                        id: homestay.id * 1000, // Unique ID
                        img_url: fallbackImages[imageIndex],
                        is_primary: true,
                        order: 1
                    }];
            }
            // Apply translations to homestay
            const translatedHomestay = homestay.translations
                ? (0, translation_utils_1.applyHomestayTranslations)(homestay, homestay.translations, lang)
                : homestay;
            // Apply translations to rooms
            if (translatedHomestay.rooms && translatedHomestay.rooms.length > 0) {
                translatedHomestay.rooms = (0, translation_utils_1.applyRoomsTranslations)(translatedHomestay.rooms, roomTranslationsMap, lang);
            }
            // Clean up translation data from response
            delete translatedHomestay.translations;
            processedHomestays.push(translatedHomestay);
        }
        res.json({
            status: 'success',
            data: processedHomestays
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllHomestays = getAllHomestays;
// Get a single homestay by ID with owner name, images, and rooms (including room features)
const getHomestayById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const lang = (0, translation_utils_1.validateLanguageCode)(req.query.lang);
        const query = `
      SELECT 
        h.*,
        u.name as owner_name,
        (
          SELECT json_agg(
            json_build_object('id', hi.id, 'img_url', hi.img_url, 'is_primary', hi.is_primary, 'order', hi."order")
            ORDER BY hi."order", hi.id
          )
          FROM "homestayImages" hi 
          WHERE hi.homestay_id = h.id
        ) as "homestayImages",
        (
          SELECT json_agg(json_build_object(
            'id', hr.id, 
            'room_id', hr.id,
            'title', hr.title, 
            'name', hr.title,
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
        ) as rooms,
        (
          SELECT json_agg(
            json_build_object(
              'language_code', ht.language_code,
              'title', ht.title,
              'description', ht.description
            )
          )
          FROM "homestay_translations" ht
          WHERE ht.homestay_id = h.id
        ) as translations
      FROM "homestay" h 
      JOIN "admin_users" u ON h.user_id = u.id 
      WHERE h.id = $1;
    `;
        const { rows: homestays } = await database_1.pool.query(query, [id]);
        if (homestays.length === 0) {
            return next(new error_middleware_1.AppError('Homestay not found', 404));
        }
        const homestay = homestays[0];
        // 🚨 EXHIBITION FIX: Only use fallback if NO real images exist
        if (homestay.homestayImages === null) {
            const fallbackImages = [
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
            ];
            const imageIndex = homestay.id % fallbackImages.length;
            homestay.homestayImages = [{
                    id: homestay.id * 1000,
                    img_url: fallbackImages[imageIndex],
                    is_primary: true,
                    order: 1
                }];
        }
        // Apply translations to homestay
        const translatedHomestay = homestay.translations
            ? (0, translation_utils_1.applyHomestayTranslations)(homestay, homestay.translations, lang)
            : homestay;
        // Fetch and apply room translations separately for better performance
        if (translatedHomestay.rooms && translatedHomestay.rooms.length > 0) {
            const roomIds = translatedHomestay.rooms.map((room) => room.id);
            const roomTranslationsQuery = `
        SELECT room_id, language_code, title, description
        FROM "room_translations"
        WHERE room_id = ANY($1)
      `;
            const { rows: roomTranslations } = await database_1.pool.query(roomTranslationsQuery, [roomIds]);
            // Group translations by room_id
            const roomTranslationsMap = {};
            roomTranslations.forEach(translation => {
                if (!roomTranslationsMap[translation.room_id]) {
                    roomTranslationsMap[translation.room_id] = [];
                }
                roomTranslationsMap[translation.room_id].push(translation);
            });
            // Apply translations to rooms
            translatedHomestay.rooms = (0, translation_utils_1.applyRoomsTranslations)(translatedHomestay.rooms, roomTranslationsMap, lang);
        }
        // Clean up translation data from response
        delete translatedHomestay.translations;
        res.json({
            status: 'success',
            data: translatedHomestay
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getHomestayById = getHomestayById;
const createHomestay = async (req, res, next) => {
    try {
        const { title, description, user_id, // This should be populated from authenticated user (e.g. req.user.id)
        status, has_rooms, location, address, base_price, max_guests, contact_number } = req.body;
        // const actual_user_id = req.user?.id; // Assuming req.user.id holds the admin_users id
        // if (!actual_user_id) {
        //   return next(new AppError('User not authenticated or user ID missing', 401));
        // }
        // For now, we'll use user_id from body, but it should come from req.user
        if (!user_id) {
            return next(new error_middleware_1.AppError('user_id is required to create a homestay', 400));
        }
        const { rows: [newHomestay] } = await database_1.pool.query(`INSERT INTO "homestay" (title, description, user_id, status, has_rooms, location, address, base_price, max_guests, contact_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`, [title, description, user_id, status !== null && status !== void 0 ? status : 'active', has_rooms !== null && has_rooms !== void 0 ? has_rooms : false, location, address, base_price, max_guests, contact_number]);
        // TODO: Handle image creation in "homestayImages" table separately if primary_image_url or multiple images are provided.
        res.status(201).json({
            status: 'success',
            data: newHomestay
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createHomestay = createHomestay;
const updateHomestay = async (req, res, next) => {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const homestayId = parseInt(id, 10);
        if (isNaN(homestayId)) {
            return next(new error_middleware_1.AppError('Invalid homestay ID format', 400));
        }
        const { title, description, status, has_rooms, location, address, base_price, max_guests, contact_number } = req.body;
        const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Assuming req.user.id holds the admin_users id
        // Check if homestay exists and (optionally) if it belongs to the user if not super_admin
        // For simplicity, this check assumes any authenticated admin user can update, or it's owned by them.
        // Proper authorization logic might be more complex (e.g. check role).
        const { rows: existingHomestays } = await database_1.pool.query('SELECT * FROM "homestay" WHERE id = $1 AND user_id = $2', // only owner can update
        [homestayId, loggedInUserId]);
        if (existingHomestays.length === 0 && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'super_admin') { // allow super_admin to update any
            const { rows: anyHomestay } = await database_1.pool.query('SELECT * FROM "homestay" WHERE id = $1', [homestayId]);
            if (anyHomestay.length === 0) {
                return next(new error_middleware_1.AppError('Homestay not found', 404));
            }
            if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'super_admin') {
                return next(new error_middleware_1.AppError('Unauthorized to update this homestay', 403));
            }
        }
        if (existingHomestays.length === 0 && ((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) === 'super_admin') {
            // Super admin is trying to update a homestay not owned by them, which is allowed.
            // We need to fetch the current values for COALESCE if the owner check failed.
            const { rows: currentHomestayResult } = await database_1.pool.query('SELECT * FROM "homestay" WHERE id = $1', [homestayId]);
            if (currentHomestayResult.length === 0) {
                return next(new error_middleware_1.AppError('Homestay not found', 404));
            }
        }
        const { rows: [updatedHomestay] } = await database_1.pool.query(`UPDATE "homestay" 
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
       RETURNING *`, [
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
        ]);
        res.json({
            status: 'success',
            data: updatedHomestay
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateHomestay = updateHomestay;
const deleteHomestay = async (req, res, next) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const homestayId = parseInt(id, 10);
        if (isNaN(homestayId)) {
            return next(new error_middleware_1.AppError('Invalid homestay ID format', 400));
        }
        const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Assuming req.user.id holds the admin_users id
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        // Check if homestay exists
        const { rows: existingHomestays } = await database_1.pool.query('SELECT * FROM "homestay" WHERE id = $1', [homestayId]);
        if (existingHomestays.length === 0) {
            return next(new error_middleware_1.AppError('Homestay not found', 404));
        }
        // Check for authorization: either owner or super_admin
        if (userRole !== 'super_admin' && existingHomestays[0].user_id !== loggedInUserId) {
            return next(new error_middleware_1.AppError('Unauthorized to delete this homestay', 403));
        }
        // TODO: Consider what happens to homestayRooms, bookings, reviews, images on deletion (CASCADE or SET NULL)
        // The schema uses ON DELETE CASCADE for homestayImages and homestayRoom.
        // Bookings referencing rooms of this homestay might need specific handling if not cascaded from rooms.
        // Reviews also have FKs that might cascade or need attention.
        await database_1.pool.query('DELETE FROM "homestay" WHERE id = $1', [homestayId]);
        res.json({
            status: 'success',
            message: 'Homestay deleted successfully',
            data: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteHomestay = deleteHomestay;
// New function to add an image to a homestay
const addHomestayImage = async (req, res, next) => {
    var _a, _b;
    const client = await database_1.pool.connect(); // Use a client for transaction
    try {
        const { homestayId } = req.params;
        const { img_url, is_primary, order } = req.body;
        const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const homestayIdNum = parseInt(homestayId, 10);
        if (isNaN(homestayIdNum)) {
            return next(new error_middleware_1.AppError('Invalid homestay ID format', 400));
        }
        if (!img_url || typeof img_url !== 'string') {
            return next(new error_middleware_1.AppError('Image URL (img_url) is required and must be a string', 400));
        }
        // Check if homestay exists
        const { rows: existingHomestays } = await client.query('SELECT user_id FROM "homestay" WHERE id = $1', [homestayIdNum]);
        if (existingHomestays.length === 0) {
            return next(new error_middleware_1.AppError('Homestay not found', 404));
        }
        // Authorization: Check if the logged-in user owns the homestay or is a super_admin
        if (userRole !== 'super_admin' && existingHomestays[0].user_id !== loggedInUserId) {
            return next(new error_middleware_1.AppError('Unauthorized to add images to this homestay', 403));
        }
        await client.query('BEGIN'); // Start transaction
        // If the new image is primary, set other images for this homestay to not be primary
        if (is_primary === true) {
            await client.query('UPDATE "homestayImages" SET is_primary = false WHERE homestay_id = $1 AND is_primary = true', [homestayIdNum]);
        }
        // Insert the new image
        const { rows: [newImage] } = await client.query(`INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [homestayIdNum, img_url, is_primary !== null && is_primary !== void 0 ? is_primary : false, order !== null && order !== void 0 ? order : 0]);
        await client.query('COMMIT'); // Commit transaction
        res.status(201).json({
            status: 'success',
            data: newImage
        });
    }
    catch (error) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        next(error);
    }
    finally {
        client.release(); // Release client back to the pool
    }
};
exports.addHomestayImage = addHomestayImage;
