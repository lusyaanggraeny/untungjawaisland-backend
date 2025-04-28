export interface Homestay {
  id: string;
  name: string;
  description: string;
  price: number;
  location: string;
  facilities: string[];
  images: string[];
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface HomestayCreateInput {
  name: string;
  description: string;
  price: number;
  location: string;
  facilities: string[];
  images: string[];
}

export interface HomestayUpdateInput extends Partial<HomestayCreateInput> {} 