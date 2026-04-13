export interface CreatePinInput {
  title: string;
  description?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  user_id: string;
}