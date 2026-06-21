export type ActivityEventType =
  | "pin_created"
  | "pin_visited"
  | "pin_liked"
  | "pin_visited_and_liked"  // merged: same actor visited + liked the same pin
  | "you_followed"           // viewer followed another user
  | "got_followed";          // another user followed the viewer

export interface ActivityEventActor {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ActivityEventPin {
  id: string;
  title: string;
  address: string | null;
  thumbnail_url: string | null;
}

export interface ActivityEvent {
  event_type: ActivityEventType;
  actor: ActivityEventActor;
  /** Present for pin_created / pin_visited / pin_liked / pin_visited_and_liked. */
  pin: ActivityEventPin | null;
  /**
   * Present for you_followed / got_followed.
   * For you_followed: the user the viewer followed.
   * For got_followed: the user who followed the viewer.
   */
  follow_target: ActivityEventActor | null;
  occurred_at: string;
  cursor_key: string;
}

export interface FeedPage {
  events: ActivityEvent[];
  next_cursor: string | null;
  has_more: boolean;
}

export type FeedTab = "mine" | "network";

export interface FeedPageInput {
  cursor?: string | null;
  limit?: number;
  tab?: FeedTab;
}
