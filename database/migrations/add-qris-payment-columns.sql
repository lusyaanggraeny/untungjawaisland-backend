-- Add QRIS payment support columns to payments table
-- Run this migration to support Xendit QRIS payments

-- Add gateway and QRIS specific columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_provider VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qris_code TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qris_expires_at TIMESTAMP;

-- Add escrow and commission tracking (for marketplace model)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS owner_payout_amount DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payout_date TIMESTAMP;

-- Add confirmation tracking for manual approval system
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS manual_confirmation_required BOOLEAN DEFAULT true;

-- Update existing payment methods to include QRIS
-- You may need to update your payment_method column constraints

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_status ON payments(booking_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_qris_expires ON payments(qris_expires_at) WHERE qris_expires_at IS NOT NULL;

-- Update payment status enum to include more statuses if needed
-- ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'EXPIRED';
-- Note: The above line might not work depending on your PostgreSQL version
-- You may need to handle enum updates differently 