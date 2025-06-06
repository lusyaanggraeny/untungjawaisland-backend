-- Migration: Add fields for same-day booking tracking
-- Date: 2024-06-05
-- Description: Adds timestamp fields to better track actual check-in/out times and housekeeping status

-- Add new columns to booking table for better tracking
ALTER TABLE "booking" 
ADD COLUMN actual_check_in_time TIMESTAMP NULL,
ADD COLUMN actual_check_out_time TIMESTAMP NULL,
ADD COLUMN housekeeping_completed_at TIMESTAMP NULL,
ADD COLUMN housekeeping_status VARCHAR(20) DEFAULT 'pending' CHECK (housekeeping_status IN ('pending', 'in_progress', 'completed'));

-- Add index for faster same-day availability queries
CREATE INDEX idx_booking_room_date_status ON "booking" (room_id, start_date, end_date, status);
CREATE INDEX idx_booking_updated_at ON "booking" (updated_at);

-- Comment the columns
COMMENT ON COLUMN "booking".actual_check_in_time IS 'Timestamp when guest actually checked in';
COMMENT ON COLUMN "booking".actual_check_out_time IS 'Timestamp when guest actually checked out';
COMMENT ON COLUMN "booking".housekeeping_completed_at IS 'Timestamp when housekeeping was completed';
COMMENT ON COLUMN "booking".housekeeping_status IS 'Status of housekeeping: pending, in_progress, completed';

-- Update existing completed bookings to have default housekeeping status
UPDATE "booking" 
SET housekeeping_status = 'completed', 
    housekeeping_completed_at = updated_at
WHERE status = 'completed' 
  AND housekeeping_status = 'pending';

-- Optional: Update room status for any orphaned occupied rooms
-- (in case rooms were marked occupied but don't have active bookings)
UPDATE "homestayRoom" 
SET status = 'available' 
WHERE status = 'occupied' 
  AND id NOT IN (
    SELECT DISTINCT room_id 
    FROM "booking" 
    WHERE status IN ('confirmed', 'pending') 
      AND start_date <= CURRENT_DATE 
      AND end_date >= CURRENT_DATE
  ); 