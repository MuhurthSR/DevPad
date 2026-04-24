import { query } from "../../config/db.js";

// ============================================================
// IDEAS SERVICE
// ============================================================

// Fetch every idea belonging to this user, newest first
export const getAllIdeas = async (userId) => {
  const sql = `
    SELECT idea_id, idea, color_theme, created_at
    FROM ideas
    WHERE user_id = $1
    ORDER BY created_at ASC
  `;
  const result = await query(sql, [userId]);
  return result.rows;
};

// Insert a new idea row with its color saved permanently
export const createIdea = async (userId, ideaText, colorTheme) => {
  const sql = `
    INSERT INTO ideas (user_id, idea, color_theme)
    VALUES ($1, $2, $3)
    RETURNING idea_id, idea, color_theme, created_at
  `;
  const result = await query(sql, [userId, ideaText, colorTheme]);
  return result.rows[0];
};

// Delete an idea — cascades automatically to canvas rows in DB
export const deleteIdea = async (ideaId, userId) => {
  const sql = `
    DELETE FROM ideas
    WHERE idea_id = $1
      AND user_id = $2
    RETURNING idea_id
  `;
  const result = await query(sql, [ideaId, userId]);
  const deleted = result.rows[0];
  if (!deleted) throw new Error("Idea not found");
  return deleted;
};

// ============================================================
// CANVAS SERVICE
// ============================================================

// Fetch the Main Canvas row for this user (idea_id IS NULL = main canvas)
export const getMainCanvas = async (userId) => {
  const sql = `
    SELECT id, content, width, height, sort_order
    FROM canvas
    WHERE user_id = $1
      AND idea_id IS NULL
  `;
  const result = await query(sql, [userId]);
  return result.rows[0] || null;
};

// Create the Main Canvas for a user (called first time they open brainstorming)
// ON CONFLICT DO NOTHING prevents duplicate rows if called twice
export const createMainCanvas = async (userId) => {
  const sql = `
    INSERT INTO canvas (user_id, idea_id)
    VALUES ($1, NULL)
    ON CONFLICT DO NOTHING
    RETURNING id, content, width, height, sort_order
  `;
  const result = await query(sql, [userId]);
  return result.rows[0];
};

// Save content and/or size of the Main Canvas
export const updateMainCanvas = async (userId, content, width, height) => {
  const sql = `
    UPDATE canvas
    SET content = COALESCE($1, content),
        width   = COALESCE($2, width),
        height  = COALESCE($3, height),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $4
      AND idea_id IS NULL
    RETURNING id, content, width, height
  `;
  // COALESCE means: use the new value if provided, otherwise keep what's already there.
  // This lets you update just content, just size, or both in one call.
  const result = await query(sql, [content, width, height, userId]);
  return result.rows[0];
};

// Fetch the canvas for a specific idea
export const getIdeaCanvas = async (ideaId, userId) => {
  const sql = `
    SELECT c.id, c.content, c.width, c.height, c.sort_order
    FROM canvas c
    JOIN ideas i ON i.idea_id = c.idea_id
    WHERE c.idea_id = $1
      AND i.user_id = $2
  `;
  // We JOIN ideas to verify this idea actually belongs to this user
  // Never trust just the ideaId alone — always scope to userId
  const result = await query(sql, [ideaId, userId]);
  return result.rows[0] || null;
};

// Create a canvas row for a specific idea (called when user clicks an idea chip)
export const createIdeaCanvas = async (ideaId, userId) => {
  const sql = `
    INSERT INTO canvas (idea_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING id, content, width, height, sort_order
  `;
  const result = await query(sql, [ideaId, userId]);
  return result.rows[0];
};

// Save content and/or size of an idea canvas
export const updateIdeaCanvas = async (canvasId, userId, content, width, height) => {
  const sql = `
    UPDATE canvas
    SET content    = COALESCE($1, content),
        width      = COALESCE($2, width),
        height     = COALESCE($3, height),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
      AND user_id = $5
    RETURNING id, content, width, height
  `;
  const result = await query(sql, [content, width, height, canvasId, userId]);
  const canvas = result.rows[0];
  if (!canvas) throw new Error("Canvas not found");
  return canvas;
};

// Bulk update sort_order after user drags canvases to reorder them
// Receives an array like: [{ id: "123", sort_order: 0 }, { id: "456", sort_order: 1 }]
export const updateCanvasOrder = async (canvases, userId) => {
  // We build one query that updates all rows in a single DB call
  // unnest() expands the arrays into rows Postgres can work with
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

// ============================================================
// PROJECTS SERVICE
// ============================================================

// Fetch only the pinned projects sorted by sidebar position
export const getPinnedProjects = async (userId) => {
  const sql = `
    SELECT p.id, p.project_name, p.context, p.sidebar_order,
           i.color_theme, i.idea_id
    FROM projects p
    JOIN ideas i ON i.idea_id = p.idea_id
    WHERE p.user_id = $1
      AND p.is_pinned_to_sidebar = TRUE
    ORDER BY p.sidebar_order ASC
  `;
  // We JOIN ideas to get the color_theme for the sidebar color dot
  const result = await query(sql, [userId]);
  return result.rows;
};

// Fetch ALL projects regardless of pin state (for the Projects.tsx dropdown)
export const getAllProjects = async (userId) => {
  const sql = `
    SELECT p.id, p.project_name, p.context, p.is_pinned_to_sidebar,
           p.sidebar_order, i.color_theme, i.idea_id
    FROM projects p
    JOIN ideas i ON i.idea_id = p.idea_id
    WHERE p.user_id = $1
    ORDER BY p.created_at ASC
  `;
  const result = await query(sql, [userId]);
  return result.rows;
};

// Create a new project linked to an idea
export const createProject = async (userId, ideaId, projectName, context) => {
  const sql = `
    INSERT INTO projects (user_id, idea_id, project_name, context)
    VALUES ($1, $2, $3, $4)
    RETURNING id, project_name, context, is_pinned_to_sidebar, sidebar_order
  `;
  const result = await query(sql, [userId, ideaId, projectName, context]);
  return result.rows[0];
};

// Generic update — handles pinning, renaming, any single field change
// fields is an object like: { is_pinned_to_sidebar: false } or { project_name: "New Name" }
export const updateProject = async (projectId, userId, fields) => {
  // Dynamically build SET clause from whatever fields are passed in
  // This avoids writing a separate function for every possible field update
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  // Builds: "is_pinned_to_sidebar = $1, updated_at = CURRENT_TIMESTAMP"
  const setClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");

  const sql = `
    UPDATE projects
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${keys.length + 1}
      AND user_id = $${keys.length + 2}
    RETURNING id, project_name, is_pinned_to_sidebar, sidebar_order
  `;
  const result = await query(sql, [...values, projectId, userId]);
  const project = result.rows[0];
  if (!project) throw new Error("Project not found");
  return project;
};

// Bulk update sidebar_order after drag-and-drop reorder in AppSidebar
// Receives: [{ id: "abc", sidebar_order: 0 }, { id: "xyz", sidebar_order: 1 }]
export const updateSidebarOrder = async (projects, userId) => {
  const ids = projects.map((p) => p.id);
  const orders = projects.map((p) => p.sidebar_order);

  const sql = `
    UPDATE projects
    SET sidebar_order = updates.sidebar_order,
        updated_at = CURRENT_TIMESTAMP
    FROM (
      SELECT unnest($1::uuid[]) AS id,
             unnest($2::int[])  AS sidebar_order
    ) AS updates
    WHERE projects.id = updates.id
      AND projects.user_id = $3
  `;
  await query(sql, [ids, orders, userId]);
};

// Delete a project — cascades to kanban_cards automatically via DB constraint
export const deleteProject = async (projectId, userId) => {
  const sql = `
    DELETE FROM projects
    WHERE id = $1
      AND user_id = $2
    RETURNING id
  `;
  const result = await query(sql, [projectId, userId]);
  const deleted = result.rows[0];
  if (!deleted) throw new Error("Project not found");
  return deleted;
};

// ============================================================
// KANBAN SERVICE
// ============================================================

// Fetch all cards for a project, grouped by column and sorted by position
export const getCardsByProject = async (projectId, userId) => {
  const sql = `
    SELECT k.id, k.title, k.context, k.task_priority,
           k.tags, k.board_column, k.position
    FROM kanban_cards k
    JOIN projects p ON p.id = k.project_id
    WHERE k.project_id = $1
      AND p.user_id = $2
    ORDER BY k.board_column, k.position ASC
  `;
  // JOIN projects to verify this project belongs to this user
  const result = await query(sql, [projectId, userId]);
  return result.rows;
};

// Create a new kanban card
export const createCard = async (projectId, title, context, priority, tags, column) => {
  const sql = `
    INSERT INTO kanban_cards (project_id, title, context, task_priority, tags, board_column)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, title, context, task_priority, tags, board_column, position
  `;
  const result = await query(sql, [projectId, title, context, priority, tags, column]);
  return result.rows[0];
};

// Generic update for any card field — same dynamic pattern as updateProject
export const updateCard = async (cardId, projectId, fields) => {
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  const setClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");

  const sql = `
    UPDATE kanban_cards
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${keys.length + 1}
      AND project_id = $${keys.length + 2}
    RETURNING id, title, context, task_priority, tags, board_column, position
  `;
  const result = await query(sql, [...values, cardId, projectId]);
  const card = result.rows[0];
  if (!card) throw new Error("Card not found");
  return card;
};

// Specifically for drag-drop between columns — just updates board_column
// Kept separate from updateCard so intent is clear in the controller
export const moveCard = async (cardId, projectId, newColumn) => {
  const sql = `
    UPDATE kanban_cards
    SET board_column = $1,
        updated_at   = CURRENT_TIMESTAMP
    WHERE id = $2
      AND project_id = $3
    RETURNING id, board_column, position
  `;
  const result = await query(sql, [newColumn, cardId, projectId]);
  const card = result.rows[0];
  if (!card) throw new Error("Card not found");
  return card;
};

// Bulk update position after cards are reordered within a column
// Receives: [{ id: "abc", position: 0 }, { id: "xyz", position: 1 }]
export const updateCardOrder = async (cards, projectId) => {
  const ids = cards.map((c) => c.id);
  const positions = cards.map((c) => c.position);

  const sql = `
    UPDATE kanban_cards
    SET position   = updates.position,
        updated_at = CURRENT_TIMESTAMP
    FROM (
      SELECT unnest($1::uuid[]) AS id,
             unnest($2::int[])  AS position
    ) AS updates
    WHERE kanban_cards.id = updates.id
      AND kanban_cards.project_id = $3
  `;
  await query(sql, [ids, positions, projectId]);
};

// Delete a card
export const deleteCard = async (cardId, projectId, userId) => {
  const sql = `
    DELETE FROM kanban_cards k
    USING projects p
    WHERE k.id = $1
      AND k.project_id = $2
      AND p.id = k.project_id
      AND p.user_id = $3
    RETURNING k.id
  `;
  // USING projects p lets us verify the project belongs to this user
  // without a separate query
  const result = await query(sql, [cardId, projectId, userId]);
  const deleted = result.rows[0];
  if (!deleted) throw new Error("Card not found");
  return deleted;
};
