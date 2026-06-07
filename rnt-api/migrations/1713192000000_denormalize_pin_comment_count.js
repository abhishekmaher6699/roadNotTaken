exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE public.pins
    ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

    UPDATE public.pins
    SET comment_count = COALESCE(comment_stats.comment_count, 0)
    FROM (
      SELECT pin_id, COUNT(*)::integer AS comment_count
      FROM public.comments
      GROUP BY pin_id
    ) comment_stats
    WHERE comment_stats.pin_id = pins.id;

    UPDATE public.pins
    SET comment_count = 0
    WHERE comment_count IS NULL;

    CREATE INDEX IF NOT EXISTS idx_comments_pin_parent_id_id
      ON public.comments (pin_id, parent_comment_id, id);

    CREATE INDEX IF NOT EXISTS idx_comments_parent_id_id
      ON public.comments (parent_comment_id, id);

    CREATE INDEX IF NOT EXISTS idx_pins_score_created_id
      ON public.pins (score DESC NULLS LAST, created_at DESC, id DESC);

    CREATE OR REPLACE FUNCTION public.calculate_pin_social_score(target_pin_id integer)
    RETURNS integer AS $$
      SELECT
        COALESCE(pins.likes_count, 0)
        + COALESCE(pins.visits_count, 0)
        + COALESCE(pins.comment_count, 0) * 2
      FROM public.pins
      WHERE pins.id = target_pin_id;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION public.calculate_pin_score(target_pin_id integer)
    RETURNS integer AS $$
      SELECT public.calculate_pin_social_score(target_pin_id);
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION public.set_pin_social_score()
    RETURNS trigger AS $$
    BEGIN
      NEW.score = COALESCE(NEW.likes_count, 0)
        + COALESCE(NEW.visits_count, 0)
        + COALESCE(NEW.comment_count, 0) * 2;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION public.set_pin_score()
    RETURNS trigger AS $$
    BEGIN
      NEW.score = COALESCE(NEW.likes_count, 0)
        + COALESCE(NEW.visits_count, 0)
        + COALESCE(NEW.comment_count, 0) * 2;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION public.refresh_pin_social_score_from_comment()
    RETURNS trigger AS $$
    DECLARE
      affected_pin_id integer;
      next_comment_count integer;
    BEGIN
      affected_pin_id = COALESCE(NEW.pin_id, OLD.pin_id);

      SELECT COUNT(*)::integer
      INTO next_comment_count
      FROM public.comments
      WHERE comments.pin_id = affected_pin_id;

      UPDATE public.pins
      SET
        comment_count = COALESCE(next_comment_count, 0),
        score = COALESCE(likes_count, 0)
          + COALESCE(visits_count, 0)
          + COALESCE(next_comment_count, 0) * 2
      WHERE id = affected_pin_id;

      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_pin_social_score_on_pins ON public.pins;
    CREATE TRIGGER set_pin_social_score_on_pins
    BEFORE INSERT OR UPDATE OF likes_count, visits_count, comment_count ON public.pins
    FOR EACH ROW
    EXECUTE FUNCTION public.set_pin_social_score();

    DROP TRIGGER IF EXISTS refresh_pin_social_score_on_comments ON public.comments;
    CREATE TRIGGER refresh_pin_social_score_on_comments
    AFTER INSERT OR DELETE OR UPDATE OF pin_id ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.refresh_pin_social_score_from_comment();

    UPDATE public.pins
    SET score = public.calculate_pin_social_score(id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_pins_score_created_id;
    DROP INDEX IF EXISTS idx_comments_parent_id_id;
    DROP INDEX IF EXISTS idx_comments_pin_parent_id_id;

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

    CREATE OR REPLACE FUNCTION public.calculate_pin_score(target_pin_id integer)
    RETURNS integer AS $$
      SELECT public.calculate_pin_social_score(target_pin_id);
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

    CREATE OR REPLACE FUNCTION public.set_pin_score()
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

    CREATE OR REPLACE FUNCTION public.refresh_pin_social_score_from_comment()
    RETURNS trigger AS $$
    DECLARE
      affected_pin_id integer;
    BEGIN
      affected_pin_id = COALESCE(NEW.pin_id, OLD.pin_id);

      UPDATE public.pins
      SET score = public.calculate_pin_social_score(affected_pin_id)
      WHERE id = affected_pin_id;

      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_pin_social_score_on_pins ON public.pins;
    CREATE TRIGGER set_pin_social_score_on_pins
    BEFORE INSERT OR UPDATE OF likes_count, visits_count ON public.pins
    FOR EACH ROW
    EXECUTE FUNCTION public.set_pin_social_score();

    DROP TRIGGER IF EXISTS refresh_pin_social_score_on_comments ON public.comments;
    CREATE TRIGGER refresh_pin_social_score_on_comments
    AFTER INSERT OR DELETE OR UPDATE OF pin_id ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.refresh_pin_social_score_from_comment();

    UPDATE public.pins
    SET score = public.calculate_pin_social_score(id);

    ALTER TABLE public.pins
    DROP COLUMN IF EXISTS comment_count;
  `);
};
