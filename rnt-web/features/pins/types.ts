export interface Pin {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  image_url?: string | null;
  user_id?: string;
}

export interface CreatePinInput {
  title: string;
  latitude: number;
  longitude: number;
  description?: string;
  image_url?: string;
}
