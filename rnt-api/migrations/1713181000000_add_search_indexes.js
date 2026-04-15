// Migration: Add pg_trgm extension and GIN indexes on pins
// for fast case-insensitive substring search (ILIKE '%query%').
//
// Why pg_trgm?
// Standard B-Tree indexes cannot accelerate wildcard-prefixed patterns like
// ILIKE '%ruins%'. pg_trgm breaks text into trigrams (3-char chunks) and
// indexes those, allowing PostgreSQL to narrow the scan dramatically even
// with a leading wildcard.
//
// We index `title` and `address` — the two columns users actually search by.
// `description` was intentionally excluded: it's long prose that is unlikely
// to match user intent, and indexing it would waste significant disk space.

exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- Fast ILIKE on pin titles (primary search target).
    CREATE INDEX IF NOT EXISTS idx_pins_title_trgm
      ON public.pins USING gin (title gin_trgm_ops);

    -- Fast ILIKE on addresses (secondary search target).
    CREATE INDEX IF NOT EXISTS idx_pins_address_trgm
      ON public.pins USING gin (address gin_trgm_ops);

    -- Fast ILIKE on posted_by / author names.
    CREATE INDEX IF NOT EXISTS idx_pins_posted_by_trgm
      ON public.pins USING gin (posted_by gin_trgm_ops);

    -- category is short and has low cardinality, a simple B-Tree index
    -- is better here and also supports exact-match filter queries later.
    CREATE INDEX IF NOT EXISTS idx_pins_category
      ON public.pins (category);

    -- status index supports the WHERE status != 'deleted' clause.
    CREATE INDEX IF NOT EXISTS idx_pins_status
      ON public.pins (status);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_pins_title_trgm;
    DROP INDEX IF EXISTS idx_pins_address_trgm;
    DROP INDEX IF EXISTS idx_pins_posted_by_trgm;
    DROP INDEX IF EXISTS idx_pins_category;
    DROP INDEX IF EXISTS idx_pins_status;
  `);
};
