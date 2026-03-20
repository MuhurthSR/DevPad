/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE TYPE kanban_column AS ENUM ('backlog','todo','in_progress','blocked','done');
    CREATE TYPE priority_level AS ENUM('low','medium','high');

    CREATE TABLE IF NOT EXISTS kanban_cards(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      board_column kanban_column DEFAULT 'todo',
      title TEXT NOT NULL UNIQUE,
      context TEXT,
      task_priority priority_level DEFAULT 'low',
      tags TEXT[] DEFAULT '{}',
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_kanban_cards_project_id ON kanban_cards(project_id);
    CREATE INDEX idx_kanban_cards_column ON kanban_cards(board_column);
    CREATE INDEX idx_kanban_cards_position ON kanban_cards(position);
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS kanban_cards CASCADE;
    DROP TYPE IF EXISTS kanban_column;
    DROP TYPE IF EXISTS priority_level;
  `);
};