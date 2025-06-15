-- Migration: Add user notification preferences table
-- This table stores user preferences for different types of notifications

BEGIN;

CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "email_bookings" BOOLEAN DEFAULT TRUE,
  "email_promotions" BOOLEAN DEFAULT FALSE,
  "email_reminders" BOOLEAN DEFAULT TRUE,
  "sms_bookings" BOOLEAN DEFAULT FALSE,
  "sms_reminders" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  CONSTRAINT fk_user_notification_preferences_user 
    FOREIGN KEY (user_id) REFERENCES "landing_page_user"(id) 
    ON DELETE CASCADE,
  
  -- Ensure one preference record per user
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
  ON "user_notification_preferences"(user_id);

-- Insert default preferences for existing users
INSERT INTO "user_notification_preferences" (user_id, email_bookings, email_promotions, email_reminders, sms_bookings, sms_reminders)
SELECT id, TRUE, FALSE, TRUE, FALSE, FALSE 
FROM "landing_page_user" 
WHERE id NOT IN (SELECT user_id FROM "user_notification_preferences" WHERE user_id IS NOT NULL);

COMMIT; 