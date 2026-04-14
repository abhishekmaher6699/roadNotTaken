export interface Pin {
  id: string;
  title: string;
  category?: string | null;
  latitude: number;
  longitude: number;
  description?: string | null;
  thumbnail_url?: string | null;
  image_urls?: string[];
  image_url?: string | null;
  user_id?: string;
}

export interface CreatePinInput {
  title: string;
  category?: string;
  latitude: number;
  longitude: number;
  description?: string;
  thumbnail_url?: string;
  image_urls?: string[];
  image_url?: string;
}
