export type HomestayStatus = 'active' | 'inactive' | 'suspended';

export interface HomestayImage {
  id: number;
  img_url: string;
  is_primary: boolean;
  order: number;
}

// New type for creating a homestay image
export interface HomestayImageCreateInput {
  img_url: string;
  is_primary?: boolean; // Optional, server can default or have logic
  order?: number;       // Optional, server can default or manage ordering
}

export interface Homestay {
  id: number;
  title: string;
  description: string | null; // TEXT can be null
  user_id: number; // Foreign key to admin_users
  status: HomestayStatus;
  has_rooms: boolean;
  location: string;
  address: string;
  base_price: number | null; // DECIMAL(10,2) can be null
  max_guests: number | null; // INTEGER can be null
  contact_number: string | null; // VARCHAR(20) can be null
  created_at: Date;
  updated_at: Date;
  images?: HomestayImage[]; // Optional, if fetched via join/subquery
  // owner_name?: string; // if joined from admin_users
}

export interface HomestayCreateInput {
  title: string;
  description?: string | null;
  user_id: number; // This will usually come from the authenticated user (e.g., req.user.id)
  status?: HomestayStatus;
  has_rooms?: boolean;
  location: string;
  address: string;
  base_price?: number | null;
  max_guests?: number | null;
  contact_number?: string | null;
  // For creating images, it's better to have a separate endpoint or handle it in a multi-step process
  // e.g., primary_image_url?: string;
}

export interface HomestayUpdateInput {
  title?: string;
  description?: string | null;
  status?: HomestayStatus;
  has_rooms?: boolean;
  location?: string;
  address?: string;
  base_price?: number | null;
  max_guests?: number | null;
  contact_number?: string | null;
} 