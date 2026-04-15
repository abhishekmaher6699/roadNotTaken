exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS postgis;

    CREATE TABLE IF NOT EXISTS public.pins (
      id serial not null,
      user_id text null,
      title text not null,
      description text null,
      latitude double precision null,
      longitude double precision null,
      geom geography null,
      likes_count integer null default 0,
      visit_count integer null default 0,
      created_at timestamp without time zone null default CURRENT_TIMESTAMP,
      thumbnail_url text null,
      image_urls text[] not null default array[]::text[],
      category text not null default 'general'::text,
      address text null,
      status text not null default 'active'::text,
      posted_by text null,
      access_level text not null default 'public'::text,
      updated_at timestamp with time zone not null default now(),
      score integer null,
      constraint pins_pkey primary key (id)
    ) TABLESPACE pg_default;

    CREATE INDEX IF NOT EXISTS idx_pins_geom on public.pins using gist (geom) TABLESPACE pg_default;
  `);

  // Setting up a trigger to auto-update the 'updated_at' column
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_pins_updated_at
    BEFORE UPDATE ON public.pins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS update_pins_updated_at ON public.pins;
    DROP FUNCTION IF EXISTS update_updated_at_column();
    DROP TABLE public.pins;
  `);
};
