exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.comments (
      id serial not null,
      pin_id integer not null,
      user_id text not null,
      content text not null,
      posted_by text null,
      created_at timestamp without time zone null default CURRENT_TIMESTAMP,
      updated_at timestamp with time zone not null default now(),
      constraint comments_pkey primary key (id),
      constraint comments_pin_id_fkey foreign key (pin_id) references public.pins (id) on delete cascade
    ) TABLESPACE pg_default;

    CREATE INDEX IF NOT EXISTS idx_comments_pin_id on public.comments (pin_id) TABLESPACE pg_default;
    CREATE INDEX IF NOT EXISTS idx_comments_user_id on public.comments (user_id) TABLESPACE pg_default;
  `);

  // Trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
    DROP TABLE IF EXISTS public.comments;
  `);
};