/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;
export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS canvas(
      id BIGSERIAL PRIMARY KEY,
      idea_id uuid NOT NULL REFERENCES ideas(idea_id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_canvas_idea_id ON canvas(idea_id);
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS canvas CASCADE;`);
};
