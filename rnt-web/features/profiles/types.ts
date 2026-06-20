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
  followers_count: number;
  following_count: number;
}

export interface PublicProfileResponse {
  user: Omit<Profile, "email" | "updated_at">;
  stats: ProfileStats;
  viewer_has_followed: boolean;
  content: {
    pins: Array<{
      id: string;
      title: string;
      address: string | null;
      likes_count: number;
      comment_count: number;
      created_at: string;
    }>;
    comments: Array<{
      id: number;
      pin_id: number;
      pin_title: string | null;
      content: string;
      likes_count: number;
      created_at: string;
    }>;
  };
}

export interface ProfileFollowMutationResponse {
  following: boolean;
  followers_count: number;
  following_count: number;
}

export interface UpdateProfileInput {
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  website?: string | null;
}

export interface ProfileSearchResult {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  total_karma: number;
  pin_count: number;
  comment_count: number;
}

export interface ProfileFollowListUser extends ProfileSearchResult {
  viewer_has_followed: boolean;
  followed_at: string;
}

export interface ProfileFollowListPage {
  users: ProfileFollowListUser[];
  next_cursor: string | null;
  has_more: boolean;
}

export type ProfileFollowListKind = "followers" | "following";
