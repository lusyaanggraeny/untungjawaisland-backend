-- Create enum types
CREATE TYPE user_role AS ENUM ('homestay_owner', 'super_admin', 'activity_manager');
CREATE TYPE user_type AS ENUM ('user', 'guest');
CREATE TYPE homestay_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE feature_category AS ENUM (
    'bedroom',           -- Bed-related features (bed size, type, etc.)
    'bathroom',          -- Bathroom amenities (shower, bathtub, etc.)
    'kitchen',           -- Kitchen facilities and appliances
    'entertainment',     -- TV, WiFi, gaming consoles, etc.
    'comfort',           -- Air conditioning, heating, etc.
    'safety',            -- Security features, smoke detectors, etc.
    'accessibility',     -- Features for people with disabilities
    'outdoor',           -- Balcony, garden, pool, etc.
    'service',           -- Room service, cleaning, etc.
    'storage',           -- Closet, safe, luggage storage
    'view',              -- Room view features (ocean view, mountain view, etc.)
    'dining',            -- Dining area, breakfast service, etc.
    'business',          -- Business-related features (desk, printer, etc.)
    'wellness',          -- Spa, fitness, yoga facilities
    'transportation'     -- Shuttle service, parking, etc.
);

-- Create admin_users table
CREATE TABLE "admin_users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(50) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(100) NOT NULL,
  "role" user_role NOT NULL DEFAULT 'homestay_owner',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_login" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create landing_page_user table
CREATE TABLE "landing_page_user" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(100) NOT NULL,
  "last_name" VARCHAR(100) NOT NULL,
  "passport" VARCHAR(50),
  "phone_number" VARCHAR(20) NOT NULL,
  "type" user_type NOT NULL,
  "country" VARCHAR(100),
  "address" TEXT,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create homestay table
CREATE TABLE "homestay" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "user_id" INTEGER NOT NULL,
  "status" homestay_status NOT NULL DEFAULT 'active',
  "has_rooms" BOOLEAN NOT NULL DEFAULT false,
  "location" VARCHAR(255) NOT NULL,
  "address" TEXT NOT NULL,
  "base_price" DECIMAL(10,2),
  "max_guests" INTEGER,
  "contact_number" VARCHAR(20),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "homestay_user" FOREIGN KEY ("user_id") REFERENCES "admin_users" ("id") ON DELETE RESTRICT
);

-- Create homestayImages table
CREATE TABLE "homestayImages" (
  "id" SERIAL PRIMARY KEY,
  "img_url" VARCHAR(255) NOT NULL,
  "homestay_id" INTEGER NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "homestay_images" FOREIGN KEY ("homestay_id") REFERENCES "homestay" ("id") ON DELETE CASCADE
);

ALTER TABLE "homestayImages" ADD CONSTRAINT "homestay_images" FOREIGN KEY ("homestay_id") REFERENCES "homestay" ("id") ON DELETE CASCADE;

-- Create homestayRoom table
CREATE TABLE "homestayRoom" (
  "id" SERIAL PRIMARY KEY,
  "homestay_id" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" room_status NOT NULL DEFAULT 'available',
  "room_number" VARCHAR(50),
  "number_people" INTEGER NOT NULL,
  "max_occupancy" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
  "size" VARCHAR(50),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "homestay_room" FOREIGN KEY ("homestay_id") REFERENCES "homestay" ("id") ON DELETE CASCADE
);

-- Create room_features table
CREATE TABLE "room_features" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "symbol" VARCHAR(50),
  "category" feature_category NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create relation_feature_room table
CREATE TABLE "relation_feature_room" (
  "id" SERIAL PRIMARY KEY,
  "room_feature_id" INTEGER NOT NULL,
  "homestay_id" INTEGER NOT NULL,
  "is_available" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feature_room" FOREIGN KEY ("homestay_id") REFERENCES "homestayRoom" ("id") ON DELETE CASCADE,
  CONSTRAINT "feature_id" FOREIGN KEY ("room_feature_id") REFERENCES "room_features" ("id") ON DELETE CASCADE
);

-- Create booking table
CREATE TABLE "booking" (
  "id" SERIAL PRIMARY KEY,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "room_id" INTEGER NOT NULL,
  "status" booking_status NOT NULL DEFAULT 'pending',
  "is_paid" BOOLEAN NOT NULL DEFAULT false,
  "user_id" INTEGER,
  "booking_number" VARCHAR(50) NOT NULL UNIQUE,
  "total_price" DECIMAL(10,2) NOT NULL,
  "payment_method" VARCHAR(50),
  "check_in_time" TIME,
  "check_out_time" TIME,
  "number_of_guests" INTEGER NOT NULL,
  "notes" TEXT,
  "special_requests" TEXT,
  "cancellation_reason" TEXT,
  "cancelled_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_booking" FOREIGN KEY ("user_id") REFERENCES "landing_page_user" ("id") ON DELETE SET NULL,
  CONSTRAINT "room_booking" FOREIGN KEY ("room_id") REFERENCES "homestayRoom" ("id") ON DELETE RESTRICT
);

-- Create reviews table
CREATE TABLE "reviews" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "homestay_id" INTEGER NOT NULL,
  "room_id" INTEGER,
  "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "comment" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_user" FOREIGN KEY ("user_id") REFERENCES "landing_page_user" ("id") ON DELETE CASCADE,
  CONSTRAINT "review_homestay" FOREIGN KEY ("homestay_id") REFERENCES "homestay" ("id") ON DELETE CASCADE,
  CONSTRAINT "review_room" FOREIGN KEY ("room_id") REFERENCES "homestayRoom" ("id") ON DELETE SET NULL
);

-- Create payments table
CREATE TABLE "payments" (
  "id" SERIAL PRIMARY KEY,
  "booking_id" INTEGER NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
  "payment_method" VARCHAR(50) NOT NULL,
  "payment_status" VARCHAR(50) NOT NULL,
  "transaction_id" VARCHAR(100),
  "payment_date" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_payment" FOREIGN KEY ("booking_id") REFERENCES "booking" ("id") ON DELETE RESTRICT
);

-- Create notifications table
CREATE TABLE "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER,
  "admin_id" INTEGER,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_notification" FOREIGN KEY ("user_id") REFERENCES "landing_page_user" ("id") ON DELETE CASCADE,
  CONSTRAINT "admin_notification" FOREIGN KEY ("admin_id") REFERENCES "admin_users" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_homestay_user_id ON homestay(user_id);
CREATE INDEX idx_homestay_images_homestay_id ON "homestayImages"(homestay_id);
CREATE INDEX idx_homestay_room_homestay_id ON "homestayRoom"(homestay_id);
CREATE INDEX idx_booking_user_id ON "booking"(user_id);
CREATE INDEX idx_booking_room_id ON "booking"(room_id);
CREATE INDEX idx_booking_status ON "booking"(status);
CREATE INDEX idx_reviews_homestay_id ON "reviews"(homestay_id);
CREATE INDEX idx_payments_booking_id ON "payments"(booking_id);
CREATE INDEX idx_notifications_user_id ON "notifications"(user_id);
CREATE INDEX idx_notifications_admin_id ON "notifications"(admin_id);

-- Check if homestayImages table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'homestayImages'
);

-- Check if homestayImages table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name ILIKE '%homestay%image%';
INSERT INTO "homestay" (
  "title",
  "description",
  "user_id",
  "status",
  "has_rooms",
  "location",
  "address",
  "base_price",
  "max_guests",
  "contact_number"
) VALUES (
  'Cozy Beachside Homestay',
  'A comfortable homestay near the beach, perfect for families.',
  1, -- Replace with a valid admin_users.id
  'active',
  true,
  'Bali, Indonesia',
  'Jl. Pantai Kuta No. 123, Kuta, Bali',
  500000.00,
  4,
  '+628123456789'
);INSERT INTO "admin_users" (
  "username",
  "password",
  "email",
  "name",
  "role",
  "is_active"
) VALUES (
  'beachowner1',
  'hashedpassword123', -- Replace with a real hashed password in production!
  'owner1@example.com',
  'Budi Santoso',
  'homestay_owner',
  true
);

select * from "admin_users";
select * from "homestay";

-- Add password column to landing_page_user table
ALTER TABLE "landing_page_user" ADD COLUMN "password" VARCHAR(255);

-- Make password required for future records
ALTER TABLE "landing_page_user" ALTER COLUMN "password" SET NOT NULL;