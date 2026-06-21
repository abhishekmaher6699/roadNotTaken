export type ActivityEventType =
  | "pin_created"
  | "pin_visited"
  | "pin_liked"
  | "pin_visited_and_liked"
  | "you_followed"
  | "got_followed";

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
   * For got_followed: the user who followed the viewer (same as actor).
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
