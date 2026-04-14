export interface CreatePinInput {
  title: string;
  description?: string;
  image_url?: string;
  thumbnail_url?: string;
  image_urls?: string[];
  latitude: number;
  longitude: number;
  user_id: string;
}
