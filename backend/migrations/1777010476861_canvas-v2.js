export const shorthands = undefined;

export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE canvas
        ADD COLUMN is_open BOOLEAN DEFAULT FALSE;
    `)
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE canvas
        DROP COLUMN is_open;
    `);
};
