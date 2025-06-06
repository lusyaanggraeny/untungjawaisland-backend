-- Quick fix: Reset room 11 status and check bookings
UPDATE "homestayRoom" SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = 11;

-- Check current bookings for room 11
SELECT 
  id, 
  start_date, 
  end_date, 
  status,
  created_at
FROM "booking" 
WHERE room_id = 11 
ORDER BY start_date DESC 
LIMIT 10;

-- Check for conflicts with June 7-8 booking
SELECT 
  id, 
  start_date, 
  end_date, 
  status,
  CASE 
    WHEN start_date < '2025-06-08' AND end_date > '2025-06-07' THEN 'CONFLICT'
    ELSE 'NO CONFLICT'
  END as conflict_check
FROM "booking" 
WHERE room_id = 11 
AND status IN ('confirmed', 'pending', 'checked_in'); 