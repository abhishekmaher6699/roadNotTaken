export interface Pin {
  id: string;
  title: string;
  category?: string | null;
  address?: string | null;
  status?: string | null;
  posted_by?: string | null;
  access_level?: string | null;
  latitude: number;
  longitude: number;
  description?: string | null;
  thumbnail_url?: string | null;
  image_urls?: string[];
  image_url?: string | null;
  user_id?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreatePinInput {
  title: string;
  category?: string;
  address?: string;
  status?: string;
  posted_by?: string;
  access_level?: string;
  latitude: number;
  longitude: number;
  description?: string;
  thumbnail_url?: string;
  image_urls?: string[];
  image_url?: string;
}

export interface UpdatePinInput {
  title: string;
  category?: string;
  address?: string;
  status?: string;
  access_level?: string;
  description?: string;
  thumbnail_url?: string;
  image_urls?: string[];
  image_url?: string;
}
