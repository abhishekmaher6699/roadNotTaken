exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.profiles (
      user_id text PRIMARY KEY,
      username text UNIQUE,
      display_name text,
      bio text,
      avatar_url text,
      location text,
      website text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_username
      ON public.profiles (username);

    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    DROP TABLE IF EXISTS public.profiles;
  `);
};
