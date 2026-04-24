// ============================================================
// brainstorming.controller.js
// ============================================================
import {
  getAllIdeas,
  createIdea,
  deleteIdea,
  getMainCanvas,
  createMainCanvas,
  updateMainCanvas,
  getIdeaCanvas,
  createIdeaCanvas,
  updateIdeaCanvas,
  updateCanvasOrder,
} from "./brainstorming.service.js";

// ─────────────────────────────────────────
// IDEAS CONTROLLERS
// ─────────────────────────────────────────

export const getIdeas = async (req, res) => {
  try {
    const userId = req.user.id;
    const ideas = await getAllIdeas(userId);
    res.status(200).json({ ideas });
  } catch (error) {
    console.error("getIdeas error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addIdea = async (req, res) => {
  try {
    const userId = req.user.id;
    const { idea, color_theme } = req.body;

    if (!idea) {
      return res.status(400).json({ error: "Idea text is required" });
    }

    if (!color_theme) {
      return res.status(400).json({ error: "color_theme is required" });
    }

    const newIdea = await createIdea(userId, idea, color_theme);
    res.status(201).json({ idea: newIdea });
  } catch (error) {
    console.error("addIdea error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeIdea = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;

    const deleted = await deleteIdea(ideaId, userId);
    res.status(200).json({ deleted });
  } catch (error) {
    const isNotFound = error.message === "Idea not found";
    console.error("removeIdea error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// CANVAS CONTROLLERS
// ─────────────────────────────────────────

// GET main canvas — if it doesn't exist yet, create it on the fly
export const fetchMainCanvas = async (req, res) => {
  try {
    const userId = req.user.id;

    let canvas = await getMainCanvas(userId);

    if (!canvas) {
      canvas = await createMainCanvas(userId);
    }

    res.status(200).json({ canvas });
  } catch (error) {
    console.error("fetchMainCanvas error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH main canvas — update content and/or size
// Frontend can send just content, just width+height, or all three
export const saveMainCanvas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, width, height } = req.body;

    // At least one field must be provided — no point calling the DB otherwise
    if (content === undefined && width === undefined && height === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const canvas = await updateMainCanvas(userId, content, width, height);
    res.status(200).json({ canvas });
  } catch (error) {
    console.error("saveMainCanvas error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET idea canvas — if it doesn't exist yet, create it on the fly
export const fetchIdeaCanvas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;

    let canvas = await getIdeaCanvas(ideaId, userId);

    if (!canvas) {
      canvas = await createIdeaCanvas(ideaId, userId);
    }

    res.status(200).json({ canvas });
  } catch (error) {
    console.error("fetchIdeaCanvas error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH idea canvas — update content and/or size
export const saveIdeaCanvas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { canvasId } = req.params;
    const { content, width, height } = req.body;

    if (content === undefined && width === undefined && height === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const canvas = await updateIdeaCanvas(canvasId, userId, content, width, height);
    res.status(200).json({ canvas });
  } catch (error) {
    const isNotFound = error.message === "Canvas not found";
    console.error("saveIdeaCanvas error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};

// PATCH canvas order — bulk update sort_order after drag-and-drop
export const reorderCanvases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order } = req.body;
    // order arrives as: [{ id: "123", sort_order: 0 }, { id: "456", sort_order: 1 }]

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: "order must be a non-empty array" });
    }

    await updateCanvasOrder(order, userId);
    res.status(200).json({ message: "Canvas order updated" });
  } catch (error) {
    console.error("reorderCanvases error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ============================================================
// brainstorming.routes.js
// ============================================================
import express from "express";
import { verifyToken } from "../../middlewares/auth.js";
import {
  getIdeas,
  addIdea,
  removeIdea,
  fetchMainCanvas,
  saveMainCanvas,
  fetchIdeaCanvas,
  saveIdeaCanvas,
  reorderCanvases,
} from "./brainstorming.controller.js";

const router = express.Router();

// ── Ideas ──────────────────────────────────────────────────
router.get("/ideas", verifyToken, getIdeas);
router.post("/ideas", verifyToken, addIdea);
router.delete("/ideas/:ideaId", verifyToken, removeIdea);

// ── Canvas ─────────────────────────────────────────────────
router.get("/canvas/main", verifyToken, fetchMainCanvas);
router.patch("/canvas/main", verifyToken, saveMainCanvas);

router.get("/canvas/idea/:ideaId", verifyToken, fetchIdeaCanvas);
router.patch("/canvas/:canvasId", verifyToken, saveIdeaCanvas);

router.patch("/canvas/order", verifyToken, reorderCanvases);

export default router;
