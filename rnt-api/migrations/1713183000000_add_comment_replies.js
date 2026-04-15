exports.up = (pgm) => {
  pgm.addColumns({ schema: 'public', name: 'comments' }, {
    parent_comment_id: {
      type: 'integer',
      notNull: false,
    },
  });

  pgm.sql(`
    ALTER TABLE public.comments
    ADD CONSTRAINT comments_parent_comment_id_fkey
    FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;
  `);

  pgm.createIndex({ schema: 'public', name: 'comments' }, 'parent_comment_id');
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE public.comments
    DROP CONSTRAINT IF EXISTS comments_parent_comment_id_fkey;
  `);
  pgm.dropIndex({ schema: 'public', name: 'comments' }, 'parent_comment_id');
  pgm.dropColumn({ schema: 'public', name: 'comments' }, 'parent_comment_id');
};