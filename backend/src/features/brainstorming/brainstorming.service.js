import { query } from "../../config/db.js";



//IDEA
export const getAllIdeas = async (userId) => {
  const sql = `SELECT idea_id,idea,color_theme,created_at
               FROM ideas
               WHERE user_id = $1
               ORDER BY created_at ASC`;

  const result = await query(sql, [userId]);
  return result.rows;
};

export const createIdea = async (userId, ideaText, colorTheme) => {
  const sql = `INSERT INTO ideas(user_id,idea,color_theme)
               VALUES ($1,$2,$3)
               RETURNING idea_id,idea,color_theme,created_at`;

  const result = await query(sql, [userId, ideaText, colorTheme]);
  return result.rows[0];
};

export const deleteIdea = async (userId, ideaId) => {
  const sql = `DELETE FROM ideas
               WHERE idea_id = $1
                AND user_id = $2
              RETURNING idea_id`;

  const result = await query(sql, [ideaId, userId]);
  const deleted = result.rows[0];

  if (!deleted) throw new Error("Idea not found");

  return deleted;
};


//============================================================================================
//CANVAS
//============================================================================================

export const getMainCanvas = async (userId) => {
  const sql = `SELECT id,content,width,height,sort_order
               FROM canvas
               WHERE user_id = $1
                AND idea_id IS NULL`;

  const result = await query(sql, [userId]);

  return result.rows[0] || null;
};

export const createMainCanvas = async (userId) => {
  const sql = `INSERT INTO canvas (user_id,idea_id)
               VALUES ($1, NULL)
               ON CONFLICT DO NOTHING
               RETURNING id,content,width,height,sort_order`;

  const result = await query(sql, [userId]);

  return result.rows[0];
};

export const updateMainCanvas = async (userId, content, width, height) => {
  const sql = `UPDATE canvas
               SET content = COALESCE($1,content),
                   width   = COALESCE($2,width),
                   height  = COALESCE($3,height),
                   updated_at = CURRENT_TIMESTAMP
               WHERE user_id = $4 AND idea_id IS NULL
               RETURNING id,content,width,height`;

  const result = await query(sql, [
    content !== undefined ? content : null,
    width !== undefined ? width : null,
    height !== undefined ? height : null,
    userId
  ]);

  return result.rows[0];
};

export const getIdeaCanvas = async (userId, ideaId) => {
  const sql = `SELECT c.id,c.content,c.width,c.height,c.sort_order,c.is_open
               FROM canvas c
               JOIN ideas i ON i.idea_id = c.idea_id
               WHERE c.idea_id = $1
               AND i.user_id = $2`;

  const result = await query(sql, [ideaId, userId]);

  return result.rows[0] || null;
};


export const createIdeaCanvas = async (userId, ideaId) => {
  const sql = `INSERT INTO canvas(idea_id,user_id,is_open)
               VALUES ($1,$2,TRUE)
               ON CONFLICT DO NOTHING
               RETURNING id,content,width,height,sort_order,is_open`;

  const result = await query(sql, [ideaId, userId]);

  return result.rows[0];
};

export const updateIdeaCanvas = async (userId, canvasId, content, width, height) => {
  const sql = `UPDATE canvas
               SET content = COALESCE($1,content),
                   width   = COALESCE($2,width),
                   height  = COALESCE($3,height),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $4
               AND user_id = $5
               RETURNING id,content,width,height`;

  const result = await query(sql, [
    content !== undefined ? content : null,
    width !== undefined ? width : null,
    height !== undefined ? height : null,
    canvasId,
    userId
  ]);

  const canvas = result.rows[0];

  if (!canvas) throw new Error("Canvas Not Found");

  return canvas;
};


export const updateCanvasOrder = async (canvases, userId) => {
  const ids = canvases.map((c) => c.id);

  const orders = canvases.map((c) => c.sort_order);

  const sql = `
    UPDATE canvas
    SET sort_order = updates.sort_order,
        updated_at = CURRENT_TIMESTAMP
    FROM (
      SELECT unnest($1::bigint[]) AS id,
             unnest($2::int[])    AS sort_order
    ) AS updates
    WHERE canvas.id = updates.id
      AND canvas.user_id = $3
  `;

  await query(sql, [ids, orders, userId]);
};

export const getAllOpenCanvases = async(userId) => {
  const sql = `SELECT c.id,c.idea_id,c.content,c.width,c.height,c.sort_order,c.is_open
               FROM canvas c
               JOIN ideas i ON i.idea_id = c.idea_id
               WHERE i.user_id = $1
               AND c.is_open = TRUE
               ORDER BY c.sort_order ASC`;

  const result = await  query(sql,[userId]);

  return result.rows;
};

export const setCanvasOpen = async (userId, canvasId, isOpen) => {
  const sql = `UPDATE canvas
               SET is_open = $1,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $2
                 AND user_id = $3
               RETURNING id, is_open`;

  const result = await query(sql, [isOpen, canvasId, userId]);
  return result.rows[0];
};
