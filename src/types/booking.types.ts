export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum HousekeepingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface Booking {
  id: number;
  start_date: Date;
  end_date: Date;
  room_id: number;
  status: BookingStatus;
  is_paid: boolean;
  user_id: number | null;
  booking_number: string;
  total_price: number;
  payment_method: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  number_of_guests: number;
  notes: string | null;
  special_requests: string | null;
  cancellation_reason: string | null;
  cancelled_at: Date | null;
  actual_check_in_time: Date | null;
  actual_check_out_time: Date | null;
  housekeeping_completed_at: Date | null;
  housekeeping_status: HousekeepingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface BookingCreateInput {
  start_date: string | Date;
  end_date: string | Date;
  room_id: number;
  number_of_guests: number;
  special_requests?: string;
  notes?: string;
  check_in_time?: string;
  check_out_time?: string;
  payment_method?: string;
}

export interface BookingStatusUpdateInput {
  status: BookingStatus;
  cancellation_reason?: string;
}

export interface SameDayAvailabilityData {
  is_available: boolean;
  early_checkout: boolean;
  earliest_booking_time: string;
  can_book_today: boolean;
  message: string;
  checkout_time?: string;
  housekeeping_status?: HousekeepingStatus;
  housekeeping_complete_time?: string;
  current_booking?: {
    id: number;
    booking_number: string;
    end_date: Date;
    status: BookingStatus;
  };
  previous_booking?: {
    id: number;
    booking_number: string;
    checkout_time: string;
  };
}

export interface BookingWithRelations extends Booking {
  homestay?: {
    id: number;
    title: string;
    address: string;
    contact_number?: string;
  };
  room?: {
    id: number;
    title: string;
    room_number?: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
  };
} 