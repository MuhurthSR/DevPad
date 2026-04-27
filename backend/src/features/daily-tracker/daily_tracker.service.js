import {query} from '../../config/db.js';

export const getTodayLog = async(userId) => {

  const sql = `SELECT id,target_date,scratchpad
               FROM daily_logs
               WHERE user_id = $1
               AND target_date = CURRENT_DATE`;
  
  const result = await query(sql,[userId]);

  const log = result.rows[0];

  if(!log) return null;

  return log;
};


export const createTodayLog = async(userId) => {

  const sql = `INSERT INTO daily_logs(user_id,target_date)
               VALUES ($1, CURRENT_DATE)
               ON CONFLICT(user_id,target_date) DO NOTHING
               RETURNING id,target_date,scratchpad`;

  const result = await query(sql,[userId]);

  const todayLog = result.rows[0];

  if(!todayLog) return null;

  return todayLog;
};

export const getTodayLogWithTask = async(userId) => {
  
  const sql = `SELECT
                dl.id AS log_id,
                dl.target_date,
                dl.scratchpad,
                dt.id AS task_id,
                dt.task,
                dt.is_completed,
                dt.position
                
              FROM daily_logs dl
              LEFT JOIN daily_tasks dt ON dt.daily_log_id = dl.id
              WHERE dl.user_id = $1
                AND dl.target_date = CURRENT_DATE
              ORDER BY dt.position ASC`;

  const result = await query(sql,[userId]);

  const tasks = result.rows;

  return tasks;
};

export const addTask = async (logId,taskText,position) =>{
  const sql = `INSERT INTO daily_tasks (daily_log_id, task, position)
               VALUES ($1, $2, $3)
               RETURNING id, task, is_completed, position`;

  const result = await query(sql,[logId,taskText,position]);

  return result.rows[0];
};

export const updateTask = async (isCompleted, taskId, logId) => {
  const sql = `
    UPDATE daily_tasks
    SET is_completed = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND daily_log_id = $3
    RETURNING id, task, is_completed, position
  `;

  const result = await query(sql, [isCompleted, taskId, logId]);
  const task = result.rows[0];

  if (!task) throw new Error('Task not found');

  return task;
};

export const deleteTask = async (taskId, logId) => {
  const sql = `
    DELETE FROM daily_tasks
    WHERE id = $1
      AND daily_log_id = $2
    RETURNING id
  `;

  const result = await query(sql, [taskId, logId]);
  const task = result.rows[0];

  if (!task) throw new Error('Task not found');

  return task;
};

export const logScratchpad = async(logScratch,logId,userId) =>{
  const sql = `UPDATE daily_logs SET scratchpad = $1,
               updated_at = CURRENT_TIMESTAMP
               WHERE id = $2
               AND
               user_id = $3
               RETURNING scratchpad`;
  
  const result = await query(sql,[logScratch,logId,userId]);
  return result.rows[0];
};
