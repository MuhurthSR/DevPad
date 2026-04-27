import { createIdea, createIdeaCanvas, createMainCanvas, deleteIdea, getAllIdeas, getAllOpenCanvases, getIdeaCanvas, getMainCanvas, setCanvasOpen, updateCanvasOrder, updateIdeaCanvas, updateMainCanvas } from "./brainstorming.service.js";



export const getIdeas = async (req, res) => {
  try {
    const userId = req.user.id;
    const ideas = await getAllIdeas(userId);

    res.status(200).json({ ideas });
  } catch (error) {
    console.error("getIdeas error : ", error);
    res.status(500).json({ error: "Internal Server Error" });
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

    res.status(200).json({ idea: newIdea });
  } catch (error) {
    console.error("addIdea error : ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeIdea = async (req, res) => {
  try {
    const userId = req.user.id;

    const { ideaId } = req.params;

    const deleted = await deleteIdea(userId, ideaId);

    res.status(200).json({ deleted });
  } catch (error) {
    const isNotFound = error.message === "Idea not found";
    console.error("removeIdea error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};


export const fetchMainCanvas = async (req, res) => {
  try {
    const userId = req.user.id;

    let canvas = await getMainCanvas(userId);

    if (!canvas) {
      canvas = await createMainCanvas(userId);
    }

    res.status(200).json({ canvas })
  } catch (error) {
    console.error("fetchMainCanvas error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const saveMainCanvas = async (req, res) => {
  try {
    const userId = req.user.id;

    const { content, width, height } = req.body;

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

export const fetchIdeaCanvas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;

    let canvas = await getIdeaCanvas(userId, ideaId);

    if (!canvas) {
      canvas = await createIdeaCanvas(userId, ideaId);
    }


    if (canvas && !canvas.is_open) {
      await setCanvasOpen(userId, String(canvas.id), true);
      canvas.is_open = true;
    }

    res.status(200).json({ canvas });
  } catch (error) {
    console.error("fetchIdeaCanvas error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const saveIdeaCanvas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { canvasId } = req.params;
    const { content, width, height } = req.body;

    if (content === undefined && width === undefined && height === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const canvas = await updateIdeaCanvas(userId, canvasId, content, width, height);

    res.status(200).json({ canvas });
  } catch (error) {
    const isNotFound = error.message === "Canvas not found";
    console.error("saveIdeaCanvas error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};


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

export const getOpenCanvases = async (req, res) => {
  try {
    const userId = req.user.id;
    const canvases = await getAllOpenCanvases(userId);
    res.status(200).json({ canvases });
  } catch (error) {
    console.error("getOpenCanvases error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleCanvasOpen = async (req, res) => {
  try {
    const userId = req.user.id;
    const { canvasId } = req.params;
    const { is_open } = req.body;

    if (typeof is_open !== "boolean") {
      return res.status(400).json({ error: "is_open status must be boolean" });
    }
    const canvas = await setCanvasOpen(userId, canvasId, is_open);

    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    res.status(200).json({ canvas });
  } catch (error) {
    console.error("toggleCanvasOpen error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};