/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS daily_tasks(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      daily_log_id uuid NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
      task TEXT NOT NULL,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_daily_tasks_log_id ON daily_tasks(daily_log_id);
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS daily_tasks CASCADE;`);
};