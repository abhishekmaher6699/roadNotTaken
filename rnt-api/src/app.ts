import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getPool } from './config/db';
import { requestLogger } from './middleware/request-logger.middleware';
import { logger } from './utils/logger';


import pinsRoutes from "./modules/pins/pins.routes"
import authRoutes from "./modules/auth/auth.routes"
import uploadsRoutes from "./modules/uploads/uploads.routes"
import commentsRoutes from "./modules/comments/comments.routes"
import profilesRoutes from "./modules/profiles/profiles.routes"
import feedRoutes from "./modules/feed/feed.routes"

const app = express();

const webUrl = process.env.WEB_URL || "http://localhost:3000";

app.set("trust proxy", 1);

app.use(helmet());
app.use(requestLogger);
app.use(
  cors({
    origin: webUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));


app.use('/pins', pinsRoutes)
app.use('/auth', authRoutes)
app.use('/uploads', uploadsRoutes)
app.use('/comments', commentsRoutes)
app.use('/profiles', profilesRoutes)
app.use('/feed', feedRoutes)


app.get('/', (req, res) => {
  res.send('API running ');
});

if (process.env.NODE_ENV !== "production") {
  app.get('/db-test', async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query('SELECT NOW()');
      res.json(result.rows[0]);
    } catch (err) {
      logger.error('DB connection error', { error: err });
      res.status(500).json({ error: 'DB connection failed' });
    }
  });
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  logger.error("Unhandled request error", {
    method: req.method,
    url: req.originalUrl,
    error: err,
  });

  return res.status(500).json({ error: "Internal server error" });
});

export default app;
