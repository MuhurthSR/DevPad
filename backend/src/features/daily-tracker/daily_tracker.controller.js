import { createTodayLog, getTodayLog, getTodayLogWithTask, addTask, updateTask, deleteTask, logScratchpad } from "./daily_tracker.service.js";


export const getToday = async(req,res) => {
  try{
    const userId = req.user.id;

    let log = await getTodayLog(userId);

    if(!log){
      log = await createTodayLog(userId);
    }

    if(!log){
      return res.status(500).json({error : "Failed to get or Create today's logs"});
    }

    res.status(200).json({log});
  }catch(error){
    console.error("getToday error",error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getTaskForToday = async(req,res) => {
  try{
    const userId = req.user.id;

    const tasks = await getTodayLogWithTask(userId);

    res.status(200).json({tasks});
  }catch(error){
    console.error("getTasksForToday error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const createTask = async(req,res) => {
  try{
    const userId = req.user.id;

    const {task,position} = req.body;

    if(!task){
      return res.status(400).json({ error: "Task content is required" });
    }

    let log = await getTodayLog(userId);

    if(!log) log = await createTodayLog(userId);

    const newTask = await addTask(log.id, task, position ?? 0);
    res.status(201).json({ task: newTask });
  }catch (error) {
    console.error("createTask error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateScratchpad = async(req,res) =>{
  try{

    const userId = req.user.id;

    const {scratchpad} = req.body;

    let logId = req.params.logId;

    if(!logId){
      let log = await getTodayLog(userId);
      if(!log) log = await createTodayLog(userId);
      logId = log.id;
    }

    let update_scratchpad = await logScratchpad(scratchpad,logId,userId);

    res.status(200).json({update_scratchpad});
  }catch (error){
    console.error("scratchpad not updated : ",error);
    res.status(500).json({error : "Internal Server Error"});
  }
};


export const toggleTask = async (req, res) => {
  try {
    const { taskId, logId } = req.params;
    const { is_completed } = req.body;
    
    if (is_completed === undefined) {
      return res.status(400).json({ error: "is_completed is required" });
    }
    
    const task = await updateTask(is_completed, taskId, logId);
    res.status(200).json({ task });
  } catch (error) {
    const isNotFound = error.message === 'Task not found';
    console.error("toggleTask error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};


export const removeTask = async (req, res) => {
  try {
    const { taskId, logId } = req.params;

    await deleteTask(taskId, logId);
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    const isNotFound = error.message === 'Task not found';
    console.error("removeTask error:", error);
    res.status(isNotFound ? 404 : 500).json({ error: error.message });
  }
};