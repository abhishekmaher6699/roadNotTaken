exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.profile_follows (
      id serial PRIMARY KEY,
      follower_user_id text NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
      following_user_id text NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT profile_follows_user_unique UNIQUE (follower_user_id, following_user_id),
      CONSTRAINT profile_follows_no_self_follow CHECK (follower_user_id <> following_user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_profile_follows_follower_user_id
      ON public.profile_follows (follower_user_id);

    CREATE INDEX IF NOT EXISTS idx_profile_follows_following_user_id
      ON public.profile_follows (following_user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS public.profile_follows;
  `);
};
