-- Migration: Add OAuth support to existing user tables
-- This allows users to link Google accounts to existing accounts or create new ones

-- Add OAuth fields to landing_page_user table
ALTER TABLE "landing_page_user" ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255) UNIQUE;
ALTER TABLE "landing_page_user" ADD COLUMN IF NOT EXISTS "oauth_provider" VARCHAR(50);
ALTER TABLE "landing_page_user" ADD COLUMN IF NOT EXISTS "oauth_picture" VARCHAR(500);
ALTER TABLE "landing_page_user" ADD COLUMN IF NOT EXISTS "auth_method" VARCHAR(20) DEFAULT 'email' CHECK (auth_method IN ('email', 'google', 'both'));
ALTER TABLE "landing_page_user" ALTER COLUMN "password" DROP NOT NULL; -- Allow NULL for OAuth-only accounts

-- Add OAuth fields to admin_users table
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255) UNIQUE;
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "oauth_provider" VARCHAR(50);
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "oauth_picture" VARCHAR(500);
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "auth_method" VARCHAR(20) DEFAULT 'email' CHECK (auth_method IN ('email', 'google', 'both'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_landing_user_google_id ON "landing_page_user"(google_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_google_id ON "admin_users"(google_id);

-- Create OAuth sessions table (optional, for tracking OAuth sessions)
CREATE TABLE IF NOT EXISTS "oauth_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER,
  "user_type" VARCHAR(20) NOT NULL CHECK (user_type IN ('landing_user', 'admin_user')),
  "provider" VARCHAR(50) NOT NULL,
  "provider_id" VARCHAR(255) NOT NULL,
  "access_token" TEXT, -- Store encrypted in production
  "refresh_token" TEXT, -- Store encrypted in production
  "token_expires_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user ON "oauth_sessions"(user_id, user_type); 