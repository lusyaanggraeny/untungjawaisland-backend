-- Add Multilingual Support - Translation Tables Migration
-- Created: 2024
-- Description: Creates translation tables for homestays and rooms to support multilingual content

-- Create homestay_translations table
CREATE TABLE "homestay_translations" (
  "id" SERIAL PRIMARY KEY,
  "homestay_id" INTEGER NOT NULL,
  "language_code" VARCHAR(5) NOT NULL, -- 'en', 'id', 'es', etc.
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "homestay_translation_homestay" FOREIGN KEY ("homestay_id") REFERENCES "homestay" ("id") ON DELETE CASCADE,
  CONSTRAINT "unique_homestay_language" UNIQUE ("homestay_id", "language_code")
);

-- Create room_translations table
CREATE TABLE "room_translations" (
  "id" SERIAL PRIMARY KEY,
  "room_id" INTEGER NOT NULL,
  "language_code" VARCHAR(5) NOT NULL, -- 'en', 'id', 'es', etc.
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "room_translation_room" FOREIGN KEY ("room_id") REFERENCES "homestayRoom" ("id") ON DELETE CASCADE,
  CONSTRAINT "unique_room_language" UNIQUE ("room_id", "language_code")
);

-- Create indexes for better performance
CREATE INDEX "idx_homestay_translations_homestay_id" ON "homestay_translations"("homestay_id");
CREATE INDEX "idx_homestay_translations_language" ON "homestay_translations"("language_code");
CREATE INDEX "idx_homestay_translations_combined" ON "homestay_translations"("homestay_id", "language_code");

CREATE INDEX "idx_room_translations_room_id" ON "room_translations"("room_id");
CREATE INDEX "idx_room_translations_language" ON "room_translations"("language_code");
CREATE INDEX "idx_room_translations_combined" ON "room_translations"("room_id", "language_code");

-- Migrate existing data to English translations
INSERT INTO "homestay_translations" (homestay_id, language_code, title, description)
SELECT id, 'en', title, description
FROM "homestay"
WHERE title IS NOT NULL;

INSERT INTO "room_translations" (room_id, language_code, title, description)
SELECT id, 'en', title, description
FROM "homestayRoom"
WHERE title IS NOT NULL; 