
export const feedQueries = {
  /**
   * TAB: "network"
   * Activities of people the viewer follows, gated to post-follow events only.
   * No follow events here — those live in the personal tab.
   *
   * Params:
   *   $1 = viewer_user_id (text)
   *   $2 = cursor occurred_at (timestamptz | null)
   *   $3 = cursor tiebreak "event_type|entity_id" (text | null)
   *   $4 = limit+1 (integer)
   */
  getNetworkFeedRaw: `
    WITH following_ids AS (
      SELECT
        following_user_id,
        created_at AS followed_at
      FROM profile_follows
      WHERE follower_user_id = $1
    )
    SELECT
      event_type,
      actor_id,
      entity_id,
      entity_kind,
      occurred_at,
      (event_type || '|' || entity_id) AS tiebreak
    FROM (

      -- Someone I follow created a pin AFTER I followed them
      SELECT
        'pin_created'   AS event_type,
        pins.user_id    AS actor_id,
        pins.id::text   AS entity_id,
        'pin'           AS entity_kind,
        pins.created_at AS occurred_at
      FROM pins
      JOIN following_ids ON following_ids.following_user_id = pins.user_id
      WHERE pins.created_at >= following_ids.followed_at

      UNION ALL

      -- Someone I follow visited a pin AFTER I followed them
      SELECT
        'pin_visited'           AS event_type,
        pin_visits.user_id      AS actor_id,
        pin_visits.pin_id::text AS entity_id,
        'pin'                   AS entity_kind,
        pin_visits.created_at   AS occurred_at
      FROM pin_visits
      JOIN following_ids ON following_ids.following_user_id = pin_visits.user_id
      WHERE pin_visits.created_at >= following_ids.followed_at

      UNION ALL

      -- Someone I follow liked a pin AFTER I followed them
      SELECT
        'pin_liked'             AS event_type,
        pin_likes.user_id       AS actor_id,
        pin_likes.pin_id::text  AS entity_id,
        'pin'                   AS entity_kind,
        pin_likes.created_at    AS occurred_at
      FROM pin_likes
      JOIN following_ids ON following_ids.following_user_id = pin_likes.user_id
      WHERE pin_likes.created_at >= following_ids.followed_at

    ) raw_events
    WHERE (
      $2::timestamptz IS NULL
      OR occurred_at < $2::timestamptz
      OR (occurred_at = $2::timestamptz AND (event_type || '|' || entity_id) < $3)
    )
    ORDER BY occurred_at DESC, event_type DESC, entity_id DESC
    LIMIT $4;
  `,

  /**
   * TAB: "mine"
   * The viewer's own pins / visits / likes + who followed them + who they followed.
   *
   * Params:
   *   $1 = viewer_user_id (text)
   *   $2 = cursor occurred_at (timestamptz | null)
   *   $3 = cursor tiebreak "event_type|entity_id" (text | null)
   *   $4 = limit+1 (integer)
   */
  getMyActivityRaw: `
    SELECT
      event_type,
      actor_id,
      entity_id,
      entity_kind,
      occurred_at,
      (event_type || '|' || entity_id) AS tiebreak
    FROM (

      -- I created a pin
      SELECT
        'pin_created'   AS event_type,
        $1              AS actor_id,
        pins.id::text   AS entity_id,
        'pin'           AS entity_kind,
        pins.created_at AS occurred_at
      FROM pins
      WHERE pins.user_id = $1

      UNION ALL

      -- I visited a pin
      SELECT
        'pin_visited'           AS event_type,
        $1                      AS actor_id,
        pin_visits.pin_id::text AS entity_id,
        'pin'                   AS entity_kind,
        pin_visits.created_at   AS occurred_at
      FROM pin_visits
      WHERE pin_visits.user_id = $1

      UNION ALL

      -- I liked a pin
      SELECT
        'pin_liked'             AS event_type,
        $1                      AS actor_id,
        pin_likes.pin_id::text  AS entity_id,
        'pin'                   AS entity_kind,
        pin_likes.created_at    AS occurred_at
      FROM pin_likes
      WHERE pin_likes.user_id = $1

      UNION ALL

      -- I followed someone
      SELECT
        'you_followed'                    AS event_type,
        $1                                AS actor_id,
        profile_follows.following_user_id AS entity_id,
        'user'                            AS entity_kind,
        profile_follows.created_at        AS occurred_at
      FROM profile_follows
      WHERE profile_follows.follower_user_id = $1

      UNION ALL

      -- Someone followed me
      SELECT
        'got_followed'                   AS event_type,
        profile_follows.follower_user_id AS actor_id,
        $1                               AS entity_id,
        'user'                           AS entity_kind,
        profile_follows.created_at       AS occurred_at
      FROM profile_follows
      WHERE profile_follows.following_user_id = $1

    ) raw_events
    WHERE (
      $2::timestamptz IS NULL
      OR occurred_at < $2::timestamptz
      OR (occurred_at = $2::timestamptz AND (event_type || '|' || entity_id) < $3)
    )
    ORDER BY occurred_at DESC, event_type DESC, entity_id DESC
    LIMIT $4;
  `,

  /**
   * Batch-fetch profile info for a list of user_ids.
   * Params: $1 = text[] of user_ids
   */
  getActorProfiles: `
    SELECT user_id, username, display_name, avatar_url
    FROM profiles
    WHERE user_id = ANY($1::text[]);
  `,

  /**
   * Batch-fetch pin info for a list of pin_ids.
   * Params: $1 = integer[] of pin_ids
   */
  getPinDetails: `
    SELECT id::text, title, address, thumbnail_url
    FROM pins
    WHERE id = ANY($1::integer[]);
  `,
};
