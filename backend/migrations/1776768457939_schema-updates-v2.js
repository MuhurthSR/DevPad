export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    -- 1. canvas: add user ownership, make idea_id nullable for Main Canvas,
    --    add sizing and drag-order tracking
    ALTER TABLE canvas
      ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      ALTER COLUMN idea_id DROP NOT NULL,
      ADD COLUMN width INTEGER DEFAULT 450,
      ADD COLUMN height INTEGER DEFAULT 400,
      ADD COLUMN sort_order INTEGER DEFAULT 0;

    -- 2. projects: add sidebar pinning and order tracking
    ALTER TABLE projects
      ADD COLUMN is_pinned_to_sidebar BOOLEAN DEFAULT TRUE,
      ADD COLUMN sidebar_order INTEGER DEFAULT 0;

    -- 3. ideas: persist the color so it doesn't randomize on every fetch
    ALTER TABLE ideas
      ADD COLUMN color_theme VARCHAR(50);
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE canvas
      DROP COLUMN user_id,
      ALTER COLUMN idea_id SET NOT NULL,
      DROP COLUMN width,
      DROP COLUMN height,
      DROP COLUMN sort_order;

    ALTER TABLE projects
      DROP COLUMN is_pinned_to_sidebar,
      DROP COLUMN sidebar_order;

    ALTER TABLE ideas
      DROP COLUMN color_theme;
  `);
};