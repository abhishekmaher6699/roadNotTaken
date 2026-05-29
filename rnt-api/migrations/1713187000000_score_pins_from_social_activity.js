exports.up = (pgm) => {
  pgm.sql(`
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
    BEFORE INSERT OR UPDATE OF likes_count ON public.pins
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
    DROP TRIGGER IF EXISTS refresh_pin_social_score_on_comments ON public.comments;
    DROP TRIGGER IF EXISTS set_pin_social_score_on_pins ON public.pins;
    DROP FUNCTION IF EXISTS public.refresh_pin_social_score_from_comment();
    DROP FUNCTION IF EXISTS public.set_pin_social_score();
    DROP FUNCTION IF EXISTS public.calculate_pin_social_score(integer);
  `);
};
