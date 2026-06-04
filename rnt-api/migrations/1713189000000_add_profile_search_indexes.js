exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm
      ON public.profiles USING gin (display_name gin_trgm_ops);

    CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm
      ON public.profiles USING gin (username gin_trgm_ops);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_profiles_display_name_trgm;
    DROP INDEX IF EXISTS idx_profiles_username_trgm;
  `);
};
