-- First, query to see what homestays are available
SELECT id, title, location FROM homestay WHERE status = 'active';

-- Example query to add a Standard Room to all homestays
-- Replace the INSERT INTO query with specific IDs as needed
INSERT INTO "homestayRoom" 
(homestay_id, title, description, status, room_number, number_people, max_occupancy, price, currency, size)
SELECT 
  49, -- homestay_id
  'Standard Room', -- title 
  'Comfortable standard room with all basic amenities', -- description
  'available', -- status
  CONCAT('S', 49, '-01'), -- room_number (S for Standard, homestay_id, room number)
  2, -- number_people (base occupancy)
  3, -- max_occupancy
  300000.00, -- price in IDR
  'IDR', -- currency
  '20m²' -- size
FROM homestay
WHERE status = 'active';

-- Example query to add a Deluxe Room to a specific homestay
-- Replace [HOMESTAY_ID] with the actual homestay ID
INSERT INTO "homestayRoom" 
(homestay_id, title, description, status, room_number, number_people, max_occupancy, price, currency, size)
VALUES
(49, -- homestay_id 
'Deluxe Room', -- title
'Spacious deluxe room with premium amenities and great view', -- description
'available', -- status
'D-01', -- room_number
3, -- number_people (base occupancy)
4, -- max_occupancy
450000.00, -- price in IDR
'IDR', -- currency
'30m²' -- size
);

-- Example query to add a Family Room to a specific homestay
-- Replace [HOMESTAY_ID] with the actual homestay ID
INSERT INTO "homestayRoom" 
(homestay_id, title, description, status, room_number, number_people, max_occupancy, price, currency, size)
VALUES
(49, -- homestay_id
'Family Suite', -- title
'Large family room with multiple beds and amenities for families', -- description
'available', -- status
'F-01', -- room_number
4, -- number_people (base occupancy)
6, -- max_occupancy
600000.00, -- price in IDR
'IDR', -- currency
'45m²' -- size
);

-- Add room features to rooms
-- Example: Adding a feature to a specific room
-- First, check available features
SELECT id, title, category FROM room_features;

-- Then add the relation between feature and room
-- Replace [ROOM_ID] and [FEATURE_ID] with actual IDs
INSERT INTO relation_feature_room (room_feature_id, homestay_id, is_available)
VALUES
([FEATURE_ID], [ROOM_ID], true);

-- Check if rooms were added successfully
SELECT hr.id, h.title as homestay_name, hr.title as room_title, hr.price, hr.status
FROM "homestayRoom" hr
JOIN homestay h ON hr.homestay_id = h.id
ORDER BY h.id, hr.id; 

INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES 
  (49, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', true, 1),
  (49, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', false, 2),
  (49, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', false, 3);

  -- URGENT EXHIBITION FIX: Insert real images for homestays
-- Run this script to populate homestayImages table with unique images

-- First, let's check what homestays exist
-- SELECT id, title FROM "homestay" ORDER BY id;

-- Clear existing images (optional - remove if you want to keep existing ones)
-- DELETE FROM "homestayImages";

-- Insert unique images for each homestay
-- Using high-quality Unsplash images with different themes for each homestay

-- HOMESTAY 1: Beach House Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(49, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop&crop=center', true, 1),
(49, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&crop=center', false, 2),
(49, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center', false, 3),
(49, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&crop=center', false, 4);

-- HOMESTAY 2: Mountain Villa Theme  
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(2, 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop&crop=center', true, 1),
(2, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop&crop=center', false, 2),
(2, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center', false, 3),
(2, 'https://images.unsplash.com/photo-1502780402662-acc01917615e?w=800&h=600&fit=crop&crop=center', false, 4);

-- HOMESTAY 3: Modern Minimalist Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(3, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center', true, 1),
(3, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center', false, 2),
(3, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center', false, 3),
(3, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&crop=center', false, 4);

-- HOMESTAY 4: Traditional Indonesian Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(4, 'https://images.unsplash.com/photo-1486304873000-235643847519?w=800&h=600&fit=crop&crop=center', true, 1),
(4, 'https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&h=600&fit=crop&crop=center', false, 2),
(4, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center', false, 3),
(4, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center', false, 4);

-- HOMESTAY 5: Tropical Paradise Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(5, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&crop=center', true, 1),
(5, 'https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=800&h=600&fit=crop&crop=center', false, 2),
(5, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center', false, 3);

-- HOMESTAY 6: Coastal Retreat Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(6, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center', true, 1),
(6, 'https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=800&h=600&fit=crop&crop=center', false, 2),
(6, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&crop=center', false, 3);

-- HOMESTAY 7: Luxury Villa Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(7, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&crop=center', true, 1),
(7, 'https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&h=600&fit=crop&crop=center', false, 2),
(7, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center', false, 3);

-- HOMESTAY 8: Garden House Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(8, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center', true, 1),
(8, 'https://images.unsplash.com/photo-1502780402662-acc01917615e?w=800&h=600&fit=crop&crop=center', false, 2),
(8, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop&crop=center', false, 3);

-- HOMESTAY 9: Rustic Charm Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(9, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center', true, 1),
(9, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center', false, 2),
(9, 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop&crop=center', false, 3);

-- HOMESTAY 10: Urban Oasis Theme
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order") VALUES
(10, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center', true, 1),
(10, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&crop=center', false, 2),
(10, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&crop=center', false, 3);

-- Safe insert: Only insert for homestays that actually exist
-- This version checks if homestay exists before inserting
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
SELECT h.id, image_data.img_url, image_data.is_primary, image_data."order"
FROM "homestay" h
CROSS JOIN (
  VALUES 
    -- Beach House Theme for any homestay with id % 10 = 1
    ('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', true, 1),
    ('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop', false, 2),
    ('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', false, 3)
) AS image_data(img_url, is_primary, "order")
WHERE h.id % 10 = 1 -- Only for homestays where id ends in 1
  AND NOT EXISTS (
    SELECT 1 FROM "homestayImages" hi WHERE hi.homestay_id = h.id
  ); -- Only if no images exist yet

-- Alternative: Insert different themes based on homestay ID modulo
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
SELECT 
  h.id,
  CASE 
    WHEN h.id % 10 = 1 THEN 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop'
    WHEN h.id % 10 = 2 THEN 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop'
    WHEN h.id % 10 = 3 THEN 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'
    WHEN h.id % 10 = 4 THEN 'https://images.unsplash.com/photo-1486304873000-235643847519?w=800&h=600&fit=crop'
    WHEN h.id % 10 = 5 THEN 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop'
    WHEN h.id % 10 = 6 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
    WHEN h.id % 10 = 7 THEN 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop'
    WHEN h.id % 10 = 8 THEN 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
    WHEN h.id % 10 = 9 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
    ELSE 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
  END,
  true,
  1
FROM "homestay" h
WHERE NOT EXISTS (
  SELECT 1 FROM "homestayImages" hi WHERE hi.homestay_id = h.id AND hi.is_primary = true
);

-- Verify the inserts
SELECT 
  h.id as homestay_id,
  h.title,
  hi.img_url,
  hi.is_primary,
  hi."order"
FROM "homestay" h
LEFT JOIN "homestayImages" hi ON h.id = hi.homestay_id
ORDER BY h.id, hi."order";

-- Count images per homestay
SELECT 
  homestay_id,
  COUNT(*) as image_count,
  SUM(CASE WHEN is_primary THEN 1 ELSE 0 END) as primary_count
FROM "homestayImages"
GROUP BY homestay_id
ORDER BY homestay_id;