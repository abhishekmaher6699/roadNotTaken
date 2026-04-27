exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE public.comments
    ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS public.pin_likes (
      id serial PRIMARY KEY,
      pin_id integer NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
      user_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT pin_likes_pin_user_unique UNIQUE (pin_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_pin_likes_pin_id
      ON public.pin_likes (pin_id);
    CREATE INDEX IF NOT EXISTS idx_pin_likes_user_id
      ON public.pin_likes (user_id);

    CREATE TABLE IF NOT EXISTS public.comment_likes (
      id serial PRIMARY KEY,
      comment_id integer NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
      user_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT comment_likes_comment_user_unique UNIQUE (comment_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id
      ON public.comment_likes (comment_id);
    CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id
      ON public.comment_likes (user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS public.comment_likes;
    DROP TABLE IF EXISTS public.pin_likes;
    ALTER TABLE public.comments
    DROP COLUMN IF EXISTS likes_count;
  `);
};
