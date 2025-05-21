// Consider defining these as string literal types if you have a fixed set
// export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'E_WALLET';
// export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'; // Schema uses 'pending', 'paid', 'refunded' for bookings

export interface Payment {
  id: number; // SERIAL PRIMARY KEY
  booking_id: number; // INTEGER NOT NULL
  amount: number; // DECIMAL(10,2) NOT NULL
  currency: string; // VARCHAR(3) NOT NULL DEFAULT 'IDR'
  payment_method: string; // VARCHAR(50) NOT NULL
  payment_status: string; // VARCHAR(50) NOT NULL (e.g., 'pending', 'completed', 'failed')
  transaction_id: string | null; // VARCHAR(100)
  payment_date: Date; // TIMESTAMP NOT NULL
  created_at: Date;
  updated_at: Date;
  // transactions?: PaymentTransaction[]; // If payment_transactions table is added
}

/*
// This interface depends on whether you want a payment_transactions table
export interface PaymentTransaction {
  id: number; // Assuming SERIAL PRIMARY KEY if table is added
  payment_id: number;
  amount: number;
  status: string; // e.g., 'PENDING', 'COMPLETED', 'FAILED'
  transaction_id: string | null;
  payment_date: Date | null;
  created_at: Date;
}
*/

export interface PaymentCreateInput {
  booking_id: number;
  amount: number;
  currency?: string; // Defaults to 'IDR' in schema
  payment_method: string;
  payment_status: string; // Initial status, e.g., 'pending'
  transaction_id?: string | null;
  payment_date: string; // Expecting ISO date string from client, will be Date in DB
}

export interface PaymentUpdateInput {
  payment_method?: string;
  payment_status?: string;
  transaction_id?: string | null;
  payment_date?: string; // Expecting ISO date string from client
} 