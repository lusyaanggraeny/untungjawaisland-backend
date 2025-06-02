-- Example Queries for Adding Pictures to homestayImages Table

-- 1. Basic Insert: Add a single image to a homestay
INSERT INTO "homestayImages" (
  homestay_id,
  img_url,
  is_primary,
  "order"
) VALUES (
  1, -- Replace with your homestay ID
  'https://example.com/images/homestay1/main-room.jpg',
  true, -- Set as primary image
  1
);

-- 2. Add Multiple Images to a Homestay (Multiple INSERT statements)
-- Primary image (main photo)
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES (1, 'https://example.com/images/homestay1/exterior.jpg', true, 1);

-- Secondary images
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES (1, 'https://example.com/images/homestay1/bedroom.jpg', false, 2);

INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES (1, 'https://example.com/images/homestay1/kitchen.jpg', false, 3);

INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES (1, 'https://example.com/images/homestay1/bathroom.jpg', false, 4);

INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES (1, 'https://example.com/images/homestay1/living-room.jpg', false, 5);

-- 3. Add Multiple Images Using VALUES clause (PostgreSQL supports this)
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES 
  (2, 'https://example.com/images/homestay2/main.jpg', true, 1),
  (2, 'https://example.com/images/homestay2/room1.jpg', false, 2),
  (2, 'https://example.com/images/homestay2/room2.jpg', false, 3),
  (2, 'https://example.com/images/homestay2/garden.jpg', false, 4),
  (2, 'https://example.com/images/homestay2/pool.jpg', false, 5);

-- 4. Add Images for Multiple Homestays
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES 
  -- Homestay 3 images
  (3, 'https://example.com/images/homestay3/cover.jpg', true, 1),
  (3, 'https://example.com/images/homestay3/interior.jpg', false, 2),
  (3, 'https://example.com/images/homestay3/balcony.jpg', false, 3),
  
  -- Homestay 4 images
  (4, 'https://example.com/images/homestay4/front.jpg', true, 1),
  (4, 'https://example.com/images/homestay4/dining.jpg', false, 2),
  (4, 'https://example.com/images/homestay4/terrace.jpg', false, 3);

-- 5. Real-world Example with Actual Image URLs (using placeholder services)
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES 
  -- Using Unsplash for example images
  (1, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', true, 1),   -- Modern house exterior
  (1, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', false, 2),  -- Beautiful bedroom
  (1, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', false, 3),   -- Modern kitchen
  (1, 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', false, 4),   -- Bathroom
  (1, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', false, 5);   -- Living room

-- 6. Query with Error Handling (Check if homestay exists first)
-- This is a safe way to insert only if the homestay exists
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
SELECT 
  h.id,
  'https://example.com/images/new-photo.jpg',
  false,
  COALESCE((SELECT MAX("order") + 1 FROM "homestayImages" WHERE homestay_id = h.id), 1)
FROM "homestay" h 
WHERE h.id = 5; -- Only insert if homestay with ID 5 exists

-- 7. Update Existing Primary Image (Set new primary and unset old primary)
-- First, unset current primary image
UPDATE "homestayImages" 
SET is_primary = false 
WHERE homestay_id = 1 AND is_primary = true;

-- Then add new primary image
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES (1, 'https://example.com/images/new-primary.jpg', true, 0);

-- 8. Batch Insert with Dynamic Ordering
-- This query automatically assigns the next available order number
INSERT INTO "homestayImages" (homestay_id, img_url, is_primary, "order")
VALUES 
  (6, 'https://example.com/img1.jpg', true, 
   COALESCE((SELECT MAX("order") FROM "homestayImages" WHERE homestay_id = 6), 0) + 1),
  (6, 'https://example.com/img2.jpg', false, 
   COALESCE((SELECT MAX("order") FROM "homestayImages" WHERE homestay_id = 6), 0) + 2),
  (6, 'https://example.com/img3.jpg', false, 
   COALESCE((SELECT MAX("order") FROM "homestayImages" WHERE homestay_id = 6), 0) + 3);

-- 9. Insert with Current Timestamp (Optional since schema has DEFAULT)
INSERT INTO "homestayImages" (
  homestay_id, 
  img_url, 
  is_primary, 
  "order", 
  created_at, 
  updated_at
) VALUES (
  7,
  'https://example.com/images/timestamped.jpg',
  false,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 10. Query to verify your inserts
SELECT 
  hi.id,
  hi.homestay_id,
  h.title as homestay_title,
  hi.img_url,
  hi.is_primary,
  hi."order",
  hi.created_at
FROM "homestayImages" hi
JOIN "homestay" h ON hi.homestay_id = h.id
ORDER BY hi.homestay_id, hi."order";

/*
NOTES:
1. Always ensure the homestay_id exists in the "homestay" table before inserting
2. Only one image per homestay should have is_primary = true
3. The "order" field determines display sequence (lower numbers show first)
4. Use double quotes around "order" since it's a PostgreSQL reserved word
5. img_url should be a valid URL accessible by your frontend
6. Consider using a transaction when inserting multiple images to ensure consistency
*/ 