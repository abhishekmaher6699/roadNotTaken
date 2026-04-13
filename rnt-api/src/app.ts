import express from 'express';
import cors from 'cors';
import { getPool } from './config/db';


import pinsRoutes from "./modules/pins/pins.routes"
import authRoutes from "./modules/auth/auth.routes"

const app = express();


app.use(cors());
app.use(express.json());


app.use('/pins', pinsRoutes)
app.use('/auth', authRoutes)


app.get('/', (req, res) => {
  res.send('API running ');
});

app.get('/db-test', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    console.log('DB connection error:', err);
    res.status(500).json({ error: 'DB connection failed' });
  }
});

export default app;