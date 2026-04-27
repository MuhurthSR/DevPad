/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS daily_logs(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_date DATE NOT NULL DEFAULT CURRENT_DATE,
      scratchpad TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_date)
    );
    CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, target_date);
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS daily_logs CASCADE;`);
};
