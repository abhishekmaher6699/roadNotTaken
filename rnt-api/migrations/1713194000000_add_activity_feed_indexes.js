exports.up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_pin_likes_user_id_created_at
      ON public.pin_likes (user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_pin_visits_user_id_created_at
      ON public.pin_visits (user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_pins_user_id_created_at
      ON public.pins (user_id, created_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_pin_likes_user_id_created_at;
    DROP INDEX IF EXISTS idx_pin_visits_user_id_created_at;
    DROP INDEX IF EXISTS idx_pins_user_id_created_at;
  `);
};
