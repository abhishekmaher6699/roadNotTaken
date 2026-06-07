const profileColumns = `
  user_id,
  username,
  display_name,
  bio,
  avatar_url,
  location,
  website,
  created_at,
  updated_at
`;

export const profileQueries = {
  ensureProfile: `
    INSERT INTO profiles (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
  `,

  getProfileByUserId: `
    SELECT
      ${profileColumns}
    FROM profiles
    WHERE user_id = $1;
  `,

  updateProfile: `
    UPDATE profiles
    SET
      username = $2,
      display_name = $3,
      bio = $4,
      avatar_url = $5,
      location = $6,
      website = $7,
      updated_at = now()
    WHERE user_id = $1
    RETURNING
      ${profileColumns};
  `,

  ensurePublicProfile: `
    INSERT INTO profiles (user_id)
    SELECT $1
    WHERE EXISTS (SELECT 1 FROM pins WHERE user_id = $1)
       OR EXISTS (SELECT 1 FROM comments WHERE user_id = $1)
    ON CONFLICT (user_id) DO NOTHING;
  `,

  getPublicProfile: `
    SELECT
      profiles.user_id,
      profiles.username,
      profiles.display_name,
      profiles.bio,
      profiles.avatar_url,
      profiles.location,
      profiles.website,
      profiles.created_at,
      COALESCE(pin_stats.pin_count, 0)::integer AS pin_count,
      COALESCE(pin_stats.pin_karma, 0)::integer AS pin_karma,
      COALESCE(comment_stats.comment_count, 0)::integer AS comment_count,
      COALESCE(comment_stats.comment_karma, 0)::integer AS comment_karma
    FROM profiles
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(*) AS pin_count,
        SUM(COALESCE(likes_count, 0)) AS pin_karma
      FROM pins
      WHERE user_id = $1
      GROUP BY user_id
    ) pin_stats ON pin_stats.user_id = profiles.user_id
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(*) AS comment_count,
        SUM(COALESCE(likes_count, 0)) AS comment_karma
      FROM comments
      WHERE user_id = $1
      GROUP BY user_id
    ) comment_stats ON comment_stats.user_id = profiles.user_id
    WHERE profiles.user_id = $1;
  `,

  getPublicProfilePins: `
    SELECT
      pins.id::text,
      pins.title,
      pins.address,
      COALESCE(pins.likes_count, 0)::integer AS likes_count,
      (
        SELECT COUNT(*)
        FROM comments
        WHERE comments.pin_id = pins.id
      )::integer AS comment_count,
      pins.created_at
    FROM pins
    WHERE pins.user_id = $1
    ORDER BY pins.created_at DESC, pins.id DESC
    LIMIT 10;
  `,

  getPublicProfileComments: `
    SELECT
      comments.id,
      comments.pin_id,
      pins.title AS pin_title,
      comments.content,
      COALESCE(comments.likes_count, 0)::integer AS likes_count,
      comments.created_at
    FROM comments
    LEFT JOIN pins ON pins.id = comments.pin_id
    WHERE comments.user_id = $1
    ORDER BY comments.created_at DESC, comments.id DESC
    LIMIT 10;
  `,

  searchProfiles: `
    WITH candidate_profiles AS (
      SELECT
        profiles.user_id,
        profiles.username,
        profiles.display_name,
        profiles.bio,
        profiles.avatar_url,
        profiles.location,
        profiles.created_at,
        GREATEST(
          COALESCE(similarity(profiles.display_name, $1), 0),
          COALESCE(similarity(profiles.username, $1), 0)
        ) AS similarity_score
      FROM profiles
      WHERE
        profiles.display_name ILIKE $2
        OR profiles.username ILIKE $2
        OR profiles.display_name % $1
        OR profiles.username % $1
    ),
    pin_stats AS (
      SELECT
        user_id,
        COUNT(*) AS pin_count,
        SUM(COALESCE(likes_count, 0)) AS pin_karma
      FROM pins
      WHERE user_id IN (SELECT user_id FROM candidate_profiles)
      GROUP BY user_id
    ),
    comment_stats AS (
      SELECT
        user_id,
        COUNT(*) AS comment_count,
        SUM(COALESCE(likes_count, 0)) AS comment_karma
      FROM comments
      WHERE user_id IN (SELECT user_id FROM candidate_profiles)
      GROUP BY user_id
    )
    SELECT
      candidate_profiles.user_id,
      candidate_profiles.username,
      candidate_profiles.display_name,
      candidate_profiles.bio,
      candidate_profiles.avatar_url,
      candidate_profiles.location,
      (
        COALESCE(pin_stats.pin_karma, 0)
        + COALESCE(comment_stats.comment_karma, 0)
      )::integer AS total_karma,
      COALESCE(pin_stats.pin_count, 0)::integer AS pin_count,
      COALESCE(comment_stats.comment_count, 0)::integer AS comment_count
    FROM candidate_profiles
    LEFT JOIN pin_stats ON pin_stats.user_id = candidate_profiles.user_id
    LEFT JOIN comment_stats ON comment_stats.user_id = candidate_profiles.user_id
    ORDER BY
      candidate_profiles.similarity_score DESC,
      total_karma DESC,
      candidate_profiles.created_at DESC
    LIMIT $3;
  `,
};
