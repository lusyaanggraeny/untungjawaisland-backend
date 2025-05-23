-- DEBUG SCRIPT: Check current database state
-- Run this to see what's actually in your database

-- 1. Check how many homestays exist
SELECT 'HOMESTAYS COUNT' as check_type, COUNT(*) as count FROM "homestay";

-- 2. Check how many images exist
SELECT 'IMAGES COUNT' as check_type, COUNT(*) as count FROM "homestayImages";

-- 3. Check homestays and their image counts
SELECT 
    h.id,
    h.title,
    h.status,
    COALESCE(img_count.image_count, 0) as image_count,
    COALESCE(img_count.has_primary, false) as has_primary_image
FROM "homestay" h
LEFT JOIN (
    SELECT 
        homestay_id,
        COUNT(*) as image_count,
        BOOL_OR(is_primary) as has_primary
    FROM "homestayImages"
    GROUP BY homestay_id
) img_count ON h.id = img_count.homestay_id
ORDER BY h.id;

-- 4. Show actual images if any exist
SELECT 
    hi.homestay_id,
    h.title as homestay_title,
    hi.id as image_id,
    hi.img_url,
    hi.is_primary,
    hi."order"
FROM "homestayImages" hi
JOIN "homestay" h ON hi.homestay_id = h.id
ORDER BY hi.homestay_id, hi."order";

-- 5. Check specific homestay 49 (the one you mentioned)
SELECT 
    h.id,
    h.title,
    hi.id as image_id,
    hi.img_url,
    hi.is_primary,
    hi."order"
FROM "homestay" h
LEFT JOIN "homestayImages" hi ON h.id = hi.homestay_id
WHERE h.id = 49
ORDER BY hi."order"; 