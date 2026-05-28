import express from 'express';
import cors from 'cors';
import { getPool } from './config/db';


import pinsRoutes from "./modules/pins/pins.routes"
import authRoutes from "./modules/auth/auth.routes"
import uploadsRoutes from "./modules/uploads/uploads.routes"
import commentsRoutes from "./modules/comments/comments.routes"
import profilesRoutes from "./modules/profiles/profiles.routes"

const app = express();

const webUrl = process.env.WEB_URL || "http://localhost:3000";

app.use(
  cors({
    origin: webUrl,
    credentials: true,
  })
);
app.use(express.json());


app.use('/pins', pinsRoutes)
app.use('/auth', authRoutes)
app.use('/uploads', uploadsRoutes)
app.use('/comments', commentsRoutes)
app.use('/profiles', profilesRoutes)


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
