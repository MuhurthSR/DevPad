import { verifyToken } from "../../middlewares/auth.js";
import { createTask, getTaskForToday, getToday, toggleTask, removeTask, updateScratchpad } from "./daily_tracker.controller.js";
import express from "express";


const router = express.Router();

router.get('/today',verifyToken,getToday);
router.get('/today/tasks',verifyToken,getTaskForToday);
router.post('/today/tasks',verifyToken,createTask);
router.patch('/today/scratchpad',verifyToken,updateScratchpad);
router.patch('/:logId/tasks/:taskId',verifyToken,toggleTask);
router.delete('/:logId/tasks/:taskId',verifyToken,removeTask);


export default router;