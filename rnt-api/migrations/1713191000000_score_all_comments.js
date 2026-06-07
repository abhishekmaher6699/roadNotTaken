exports.up = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.calculate_pin_score(target_pin_id integer)
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

    UPDATE public.pins
    SET score = public.calculate_pin_score(id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.calculate_pin_score(target_pin_id integer)
    RETURNS integer AS $$
      SELECT
        COALESCE(pins.likes_count, 0)
        + COALESCE(pins.visits_count, 0)
        + (
          SELECT COUNT(*)::integer * 2
          FROM public.comments
          WHERE comments.pin_id = target_pin_id
            AND comments.parent_comment_id IS NULL
        )
      FROM public.pins
      WHERE pins.id = target_pin_id;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION public.set_pin_score()
    RETURNS trigger AS $$
    BEGIN
      NEW.score = COALESCE(NEW.likes_count, 0)
        + COALESCE(NEW.visits_count, 0)
        + (
          SELECT COUNT(*)::integer * 2
          FROM public.comments
          WHERE comments.pin_id = NEW.id
            AND comments.parent_comment_id IS NULL
        );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    UPDATE public.pins
    SET score = public.calculate_pin_score(id);
  `);
};
