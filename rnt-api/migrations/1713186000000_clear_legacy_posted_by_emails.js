exports.up = (pgm) => {
  pgm.sql(`
    UPDATE public.pins
    SET posted_by = NULL
    WHERE posted_by ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$';

    UPDATE public.comments
    SET posted_by = NULL
    WHERE posted_by ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$';
  `);
};

exports.down = () => {};
