exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE public.pins
    ADD COLUMN IF NOT EXISTS visits_count integer NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS public.pin_visits (
      id serial PRIMARY KEY,
      pin_id integer NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
      user_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT pin_visits_pin_user_unique UNIQUE (pin_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_pin_visits_pin_id
      ON public.pin_visits (pin_id);
    CREATE INDEX IF NOT EXISTS idx_pin_visits_user_id
      ON public.pin_visits (user_id);

    CREATE OR REPLACE FUNCTION public.calculate_pin_social_score(target_pin_id integer)
    RETURNS integer AS $$
      SELECT
        COALESCE(pins.likes_count, 0)
        + COALESCE(pins.visits_count, 0)
        + (
          SELECT COUNT(*)::integer * 2
          FROM public.comments
          WHERE comments.pin_id = target_pin_id
        )
      FROM public.pins
      WHERE pins.id = target_pin_id;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION public.set_pin_social_score()
    RETURNS trigger AS $$
    BEGIN
      NEW.score = COALESCE(NEW.likes_count, 0)
        + COALESCE(NEW.visits_count, 0)
        + (
          SELECT COUNT(*)::integer * 2
          FROM public.comments
          WHERE comments.pin_id = NEW.id
        );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_pin_social_score_on_pins ON public.pins;
    CREATE TRIGGER set_pin_social_score_on_pins
    BEFORE INSERT OR UPDATE OF likes_count, visits_count ON public.pins
    FOR EACH ROW
    EXECUTE FUNCTION public.set_pin_social_score();

    UPDATE public.pins
    SET score = public.calculate_pin_social_score(id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS public.pin_visits;
    ALTER TABLE public.pins
    DROP COLUMN IF EXISTS visits_count;

    CREATE OR REPLACE FUNCTION public.calculate_pin_social_score(target_pin_id integer)
    RETURNS integer AS $$
      SELECT
        COALESCE(pins.likes_count, 0)
        + (
          SELECT COUNT(*)::integer * 2
          FROM public.comments
          WHERE comments.pin_id = target_pin_id
        )
      FROM public.pins
      WHERE pins.id = target_pin_id;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION public.set_pin_social_score()
    RETURNS trigger AS $$
    BEGIN
      NEW.score = COALESCE(NEW.likes_count, 0)
        + (
          SELECT COUNT(*)::integer * 2
          FROM public.comments
          WHERE comments.pin_id = NEW.id
        );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_pin_social_score_on_pins ON public.pins;
    CREATE TRIGGER set_pin_social_score_on_pins
    BEFORE INSERT OR UPDATE OF likes_count ON public.pins
    FOR EACH ROW
    EXECUTE FUNCTION public.set_pin_social_score();

    UPDATE public.pins
    SET score = public.calculate_pin_social_score(id);
  `);
};
