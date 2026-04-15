export interface CreatePinInput {
  title: string;
  category?: string;
  address?: string;
  status?: string;
  posted_by?: string;
  access_level?: string;
  description?: string;
  thumbnail_url?: string;
  image_urls?: string[];
  latitude: number;
  longitude: number;
  user_id: string;
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
}

export interface TileQueryInput {
  tiles: Array<{
    x: number;
    y: number;
    z: number;
  }>;
}

export interface TileSummary {
  x: number;
  y: number;
  z: number;
  latitude: number;
  longitude: number;
  pin_count: number;
  top_score: number | null;
}

export interface SearchPinsInput {
  query: string;
  limit?: number;
  bounds?: { north: number; south: number; east: number; west: number } | null;
}
