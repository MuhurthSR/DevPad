import express from "express"
import { verifyToken } from "../../middlewares/auth.js";
import { addIdea, fetchIdeaCanvas, fetchMainCanvas, getIdeas, getOpenCanvases, removeIdea, reorderCanvases, saveIdeaCanvas, saveMainCanvas, toggleCanvasOpen } from "./brainstorming.controller.js";


const router = express.Router();

router.get('/ideas', verifyToken, getIdeas);
router.post('/ideas', verifyToken, addIdea);
router.delete('/ideas/:ideaId', verifyToken, removeIdea);



router.get('/canvas/main', verifyToken, fetchMainCanvas);
router.patch('/canvas/main', verifyToken, saveMainCanvas);

router.get('/canvas/open', verifyToken, getOpenCanvases);
router.patch('/canvas/:canvasId/toggle', verifyToken, toggleCanvasOpen);

router.get('/canvas/idea/:ideaId', verifyToken, fetchIdeaCanvas);
router.patch('/canvas/order', verifyToken, reorderCanvases);

router.patch('/canvas/:canvasId', verifyToken, saveIdeaCanvas);



export default router;
