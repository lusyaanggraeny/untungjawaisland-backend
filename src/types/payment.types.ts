export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'E_WALLET';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  payment_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  amount: number;
  status: PaymentStatus;
  transaction_id?: string;
  payment_date?: Date;
  created_at: Date;
}

export interface PaymentCreateInput {
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
}

export interface PaymentUpdateInput {
  status?: PaymentStatus;
  transaction_id?: string;
  payment_date?: Date;
} 