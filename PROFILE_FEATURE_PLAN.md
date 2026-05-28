# Profile And Social Feature Plan

## Goal

Add a social identity layer to Road Not Taken so every pin and comment belongs to a real user profile, authors are clickable, and users can build reputation through useful activity.

The first version should feel lightweight and practical: profile page, editable profile, author links, and karma. More advanced social systems like followers, notifications, reports, and activity feeds can build on top of this foundation.

## MVP Scope

- Create user profiles tied to auth users.
- Let users edit their profile.
- Show public profile pages.
- Make pin/comment authors clickable.
- Replace raw email display with profile display names when available.
- Add karma totals based on pin and comment likes.
- Show basic user stats: pins, comments, member since, karma.

## Data Model

### `profiles`

Each authenticated user gets one profile row.

Suggested fields:

```sql
user_id uuid primary key references auth.users(id) on delete cascade,
username text unique,
display_name text,
bio text,
avatar_url text,
location text,
website text,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Notes:

- `user_id` is the stable identity key.
- `username` should be optional at first, then enforced later if we add `/u/:username`.
- `display_name` is what we show publicly when present.
- `email` should come from auth, not be duplicated in `profiles`.
- `avatar_url` can use the existing Cloudinary upload flow.

## Karma

Karma should be derived from user activity, not manually editable.

### MVP Formula

```txt
pin_karma = total likes received on user's pins
comment_karma = total likes received on user's comments
total_karma = pin_karma + comment_karma
```

This keeps karma easy to explain and hard to desync.

### Later Formula Ideas

- +1 for creating a pin.
- +1 for creating a comment.
- Bonus for verified/high-quality pins.
- Penalty for removed or reported content.
- Daily caps or anti-farming rules.
- Separate public karma and trust/moderation score.

### Storage Strategy

For MVP, compute karma dynamically in profile endpoints.

Later, if profile pages become expensive, cache these fields on `profiles`:

```sql
pin_karma integer not null default 0,
comment_karma integer not null default 0,
total_karma integer not null default 0
```

Then update cached karma when pin/comment likes change.

## Backend API

### Profile Endpoints

```txt
GET /profiles/me
PUT /profiles/me
GET /profiles/:userId
GET /profiles/:userId/activity
```

MVP can skip activity until the public page exists.

### `GET /profiles/me`

Returns the current authenticated user profile.

If no profile exists yet, create a blank one.

Response shape:

```ts
{
  user_id: string;
  email?: string;
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  website?: string | null;
  created_at: string;
  updated_at: string;
}
```

### `PUT /profiles/me`

Updates editable profile fields.

Editable fields:

```ts
{
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
}
```

Validation:

- `username`: lowercase letters, numbers, underscores, hyphens; unique; reserved words blocked.
- `display_name`: max length around 40.
- `bio`: max length around 240.
- `website`: valid URL.
- `avatar_url`: must be trusted upload URL or empty.

### `GET /profiles/:userId`

Returns public profile data and stats.

Suggested response:

```ts
{
  user: {
    id: string;
    email?: string;
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    created_at: string;
  };
  stats: {
    total_karma: number;
    pin_karma: number;
    comment_karma: number;
    pin_count: number;
    comment_count: number;
  };
}
```

### Author Data On Existing APIs

Pins and comments should eventually return lightweight author data.

```ts
author: {
  id: string;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  email?: string;
}
```

Fallback display:

```ts
author.display_name ?? author.username ?? author.email ?? "Anonymous"
```

This lets the UI stop relying on `posted_by` as the long-term author field.

## Frontend Routes

### `/profile/edit`

Authenticated page where the current user edits their profile.

Fields:

- Avatar
- Display name
- Username
- Bio
- Location
- Website

### `/profile/[userId]`

Public profile page.

Sections:

- Header: avatar, name, username/email fallback, karma, member since.
- Bio and links.
- Stats strip: total karma, pin karma, comment karma, pins, comments.
- Tabs:
  - Pins
  - Comments
  - Activity, later

### Later Route

```txt
/u/:username
```

Do not start here. Username routes require uniqueness, reserved names, rename behavior, and redirects. Use `user_id` first.

## UI Integration Points

Make authors clickable in:

- Pin preview card.
- Pin details sidebar `Posted by`.
- Search results `by ...`.
- Comment author rows.
- Future activity feeds.

Click behavior:

- Navigate to `/profile/:userId`.
- Later, optionally open a profile drawer on top of the map for faster browsing.

## Profile Page UI Direction

The profile page should feel social but not bloated.

Style direction:

- Compact header.
- Avatar as a strong first signal.
- Karma displayed clearly but not like a game scoreboard.
- Tabs for user content.
- Map-related identity: show pins and maybe a small map of their contributions later.

Example header:

```txt
Abhishek
@abhishek
1,284 karma
23 pins · 91 comments · Joined May 2026
```

## Activity And Content

MVP:

- List user's pins.
- List user's recent comments.

Later:

- Map view of user's pins.
- Most liked pins.
- Most liked comments.
- Saved/liked pins, probably private by default.

## Notifications Later

Profile features naturally lead to notifications:

- Someone liked your pin.
- Someone liked your comment.
- Someone replied to your comment.
- Someone followed you.
- Someone mentioned you, if mentions are added.

Do not build notifications before profiles and author links are stable.

## Trust And Safety Later

Social features need moderation tools.

Future features:

- Report user.
- Report pin.
- Report comment.
- Block user.
- Hide blocked users' pins/comments.
- Soft-delete moderation state.
- Admin/mod tools.

## Recommended Build Order

1. Add `profiles` migration.
2. Add profile service/controller/routes in `rnt-api`.
3. Ensure profile row is created automatically for authenticated users.
4. Add `features/profiles` API/hooks in `rnt-web`.
5. Build `/profile/edit`.
6. Build `/profile/[userId]`.
7. Add profile stats and karma to public profile endpoint.
8. Make comment authors clickable.
9. Make pin authors clickable.
10. Replace email display with profile display fallback.
11. Add profile avatar display in comments and profile pages.
12. Add profile tabs for pins/comments.

## Non-MVP Decisions

Do not build these first:

- Followers.
- Notifications.
- Username route.
- Full activity feed.
- Cached karma.
- Badges.
- Blocking/reporting.

These are important, but they depend on the core profile model being solid.

## Open Questions

- Should profiles be public by default?
- Should users be able to hide their email from public author displays?
- Should `posted_by` be deprecated after author profiles are in place?
- Should display names be unique? Recommendation: no.
- Should usernames be required? Recommendation: no for MVP.
- Should avatar upload reuse the existing pin image upload endpoint or get a profile-specific upload folder?

