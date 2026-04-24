// ============================================================
// projects.controller.js
// ============================================================
import {
  getPinnedProjects,
  getAllProjects,
  createProject,
  updateProject,
  updateSidebarOrder,
  deleteProject,
  getCardsByProject,
  createCard,
  updateCard,
  moveCard,
  updateCardOrder,
  deleteCard,
} from "./projects.service.js";

// ─────────────────────────────────────────
// PROJECTS CONTROLLERS
// ─────────────────────────────────────────

// GET all projects — accepts ?pinned=true query param to filter sidebar projects
export const fetchProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const pinned = req.query.pinned === "true";

    // One controller handles both cases:
    // GET /api/projects          → all projects (Projects.tsx dropdown)
    // GET /api/projects?pinned=true → only pinned (AppSidebar on load)
    const projects = pinned
      ? await getPinnedProjects(userId)
      : await getAllProjects(userId);

    res.status(200).json({ projects });
  } catch (error) {
    console.error("fetchProjects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { idea_id, project_name, context } = req.body;

    if (!idea_id) {
      return res.status(400).json({ error: "idea_id is required" });
    }

    if (!project_name) {
      return res.status(400).json({ error: "project_name is required" });
    }

    const project = await createProject(userId, idea_id, project_name, context);
    res.status(201).json({ project });
  } catch (error) {
    console.error("addProject error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH single project — handles pinning, renaming, any field change
export const editProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const fields = req.body;

    // fields is whatever the frontend sends:
    // { is_pinned_to_sidebar: false } for unpinning
    // { project_name: "New Name" }    for renaming
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const project = await updateProject(projectId, userId, fields);
    res.status(200).json({ project });
  } catch (error) {
    const isNotFound = error.message === "Project not found";
    console.error("editProject error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};

// PATCH sidebar order — bulk update after drag-and-drop in AppSidebar
export const reorderSidebar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order } = req.body;
    // order arrives as: [{ id: "abc", sidebar_order: 0 }, { id: "xyz", sidebar_order: 1 }]

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: "order must be a non-empty array" });
    }

    await updateSidebarOrder(order, userId);
    res.status(200).json({ message: "Sidebar order updated" });
  } catch (error) {
    console.error("reorderSidebar error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const deleted = await deleteProject(projectId, userId);
    res.status(200).json({ deleted });
  } catch (error) {
    const isNotFound = error.message === "Project not found";
    console.error("removeProject error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// KANBAN CONTROLLERS
// ─────────────────────────────────────────

// GET all cards for a project
export const fetchCards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const cards = await getCardsByProject(projectId, userId);
    res.status(200).json({ cards });
  } catch (error) {
    console.error("fetchCards error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addCard = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, context, task_priority, tags, board_column } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    // Default to "todo" column if none provided
    const column = board_column || "todo";

    // Default tags to empty array if none provided
    const cardTags = tags || [];

    const card = await createCard(
      projectId,
      title,
      context,
      task_priority || "low",
      cardTags,
      column
    );

    res.status(201).json({ card });
  } catch (error) {
    console.error("addCard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH single card — handles any field update from the modal
export const editCard = async (req, res) => {
  try {
    const { projectId, cardId } = req.params;
    const fields = req.body;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const card = await updateCard(cardId, projectId, fields);
    res.status(200).json({ card });
  } catch (error) {
    const isNotFound = error.message === "Card not found";
    console.error("editCard error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};

// PATCH move card — specifically for drag-drop between columns
// Kept separate from editCard so the intent is clear on the frontend too
export const transferCard = async (req, res) => {
  try {
    const { projectId, cardId } = req.params;
    const { board_column } = req.body;

    if (!board_column) {
      return res.status(400).json({ error: "board_column is required" });
    }

    const card = await moveCard(cardId, projectId, board_column);
    res.status(200).json({ card });
  } catch (error) {
    const isNotFound = error.message === "Card not found";
    console.error("transferCard error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};

// PATCH card order — bulk update position after reorder within a column
export const reorderCards = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { order } = req.body;
    // order arrives as: [{ id: "abc", position: 0 }, { id: "xyz", position: 1 }]

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: "order must be a non-empty array" });
    }

    await updateCardOrder(order, projectId);
    res.status(200).json({ message: "Card order updated" });
  } catch (error) {
    console.error("reorderCards error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId, cardId } = req.params;

    const deleted = await deleteCard(cardId, projectId, userId);
    res.status(200).json({ deleted });
  } catch (error) {
    const isNotFound = error.message === "Card not found";
    console.error("removeCard error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};


// ============================================================
// projects.routes.js
// ============================================================
import express from "express";
import { verifyToken } from "../../middlewares/auth.js";
import {
  fetchProjects,
  addProject,
  editProject,
  reorderSidebar,
  removeProject,
  fetchCards,
  addCard,
  editCard,
  transferCard,
  reorderCards,
  removeCard,
} from "./projects.controller.js";

const router = express.Router();

// ── Projects ───────────────────────────────────────────────
// IMPORTANT: /sidebar-order must come before /:projectId
// Express matches top to bottom — if /:projectId came first,
// "sidebar-order" would be treated as a projectId param
router.get("/", verifyToken, fetchProjects);
router.post("/", verifyToken, addProject);
router.patch("/sidebar-order", verifyToken, reorderSidebar);
router.patch("/:projectId", verifyToken, editProject);
router.delete("/:projectId", verifyToken, removeProject);

// ── Kanban Cards ───────────────────────────────────────────
// Same rule: /reorder before /:cardId
router.get("/:projectId/cards", verifyToken, fetchCards);
router.post("/:projectId/cards", verifyToken, addCard);
router.patch("/:projectId/cards/reorder", verifyToken, reorderCards);
router.patch("/:projectId/cards/:cardId/move", verifyToken, transferCard);
router.patch("/:projectId/cards/:cardId", verifyToken, editCard);
router.delete("/:projectId/cards/:cardId", verifyToken, removeCard);

export default router;
