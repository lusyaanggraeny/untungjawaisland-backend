-- First, query to see what homestays are available
SELECT id, title, location FROM homestay WHERE status = 'active';

-- Example query to add a Standard Room to all homestays
-- Replace the INSERT INTO query with specific IDs as needed
INSERT INTO "homestayRoom" 
(homestay_id, title, description, status, room_number, number_people, max_occupancy, price, currency, size)
SELECT 
  id, -- homestay_id
  'Standard Room', -- title 
  'Comfortable standard room with all basic amenities', -- description
  'available', -- status
  CONCAT('S', id, '-01'), -- room_number (S for Standard, homestay_id, room number)
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
(2, -- homestay_id 
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
(48, -- homestay_id
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