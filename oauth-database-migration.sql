-- OAuth Database Migration
-- Add missing OAuth columns to support Google OAuth authentication

-- First, create an enum for auth methods
DO $$ BEGIN
    CREATE TYPE auth_method AS ENUM ('email', 'google', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add OAuth columns to landing_page_user table
ALTER TABLE "landing_page_user" 
ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS "oauth_provider" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "oauth_picture" TEXT,
ADD COLUMN IF NOT EXISTS "auth_method" auth_method NOT NULL DEFAULT 'email',
ADD COLUMN IF NOT EXISTS "password" VARCHAR(255); -- Make password optional for OAuth users

-- Add OAuth columns to admin_users table  
ALTER TABLE "admin_users"
ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS "oauth_provider" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "oauth_picture" TEXT,
ADD COLUMN IF NOT EXISTS "auth_method" auth_method NOT NULL DEFAULT 'email';

-- Create OAuth sessions table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS "oauth_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "user_type" VARCHAR(50) NOT NULL, -- 'landing_user' or 'admin_user'
  "provider" VARCHAR(50) NOT NULL, -- 'google', etc.
  "provider_id" VARCHAR(255) NOT NULL, -- Google user ID
  "access_token" TEXT,
  "refresh_token" TEXT,
  "token_expires_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

-- Create indexes for OAuth functionality
CREATE INDEX IF NOT EXISTS idx_landing_page_user_google_id ON "landing_page_user"(google_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_google_id ON "admin_users"(google_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user ON "oauth_sessions"(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_provider ON "oauth_sessions"(provider, provider_id);

-- Update existing users to have email auth method
UPDATE "landing_page_user" SET "auth_method" = 'email' WHERE "auth_method" IS NULL;
UPDATE "admin_users" SET "auth_method" = 'email' WHERE "auth_method" IS NULL;

-- Make phone_number optional for OAuth users (Google users might not have phone)
ALTER TABLE "landing_page_user" ALTER COLUMN "phone_number" DROP NOT NULL;

COMMIT; 