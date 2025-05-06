-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('ADMIN', 'OWNER', 'TOURIST')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create homestays table
CREATE TABLE IF NOT EXISTS homestays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    facilities JSONB NOT NULL,
    images JSONB NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIM
    E ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homestay_id UUID NOT NULL,
    user_id UUID NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homestay_id) REFERENCES homestays(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'E_WALLET')) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')) NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Create payment_transactions table for payment history
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')) NOT NULL,
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homestays_updated_at
    BEFORE UPDATE ON homestays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 