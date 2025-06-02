-- Query to change the status of all homestay rooms to 'available'
UPDATE "homestayRoom" 
SET status = 'available', 
    updated_at = CURRENT_TIMESTAMP
WHERE status != 'available';

-- Optional: Query to check the results after update
SELECT 
    id,
    homestay_id,
    title,
    room_number,
    status,
    updated_at
FROM "homestayRoom"
ORDER BY homestay_id, id;

-- Optional: Count rooms by status to verify the update
SELECT 
    status,
    COUNT(*) as room_count
FROM "homestayRoom"
GROUP BY status
ORDER BY status; 