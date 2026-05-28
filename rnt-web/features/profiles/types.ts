export interface Profile {
  user_id: string;
  email?: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ProfileStats {
  total_karma: number;
  pin_karma: number;
  comment_karma: number;
  pin_count: number;
  comment_count: number;
}

export interface PublicProfileResponse {
  user: Omit<Profile, "email" | "updated_at">;
  stats: ProfileStats;
}

export interface UpdateProfileInput {
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  website?: string | null;
}
