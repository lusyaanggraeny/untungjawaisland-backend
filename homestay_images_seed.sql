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
(1, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop&crop=center', true, 1),
(1, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&crop=center', false, 2),
(1, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center', false, 3),
(1, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&crop=center', false, 4);

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