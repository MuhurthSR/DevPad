import express from 'express';
import { register,login,getMe } from './auth.controller.js';
import { verifyToken } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/register',register);
router.post('/login',login);
router.get('/me',verifyToken,getMe);

export default router;