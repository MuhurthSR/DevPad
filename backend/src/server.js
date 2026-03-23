import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { query } from './config/db.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

app.get('/api/health',async (req, res) => {
    try{
      const dbResult  = await query('SELECT NOW()');
      
      res.status(200).json({ 
        message: 'Server is running!', 
        success: true, 
        dbTime: dbResult.rows[0].now 
      });
    }catch(err){
      console.error('Error connecting to database:', err);
      res.status(503).json({ status: 'Not healthy', message: 'Server is running but database connection failed!', success: false });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});