-- Add password column to landing_page_user table
ALTER TABLE "landing_page_user" ADD COLUMN "password" VARCHAR(255);
 
-- Make password required for future records
ALTER TABLE "landing_page_user" ALTER COLUMN "password" SET NOT NULL; 