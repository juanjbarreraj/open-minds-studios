import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { runMigrations } from './db/migrate.js';
import { attachUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errors.js';
import router from './routes/index.js';

export function createApp({ sessionSecret, corsOrigin } = {}) {
  runMigrations();

  const app = express();
  app.disable('x-powered-by');

  // The Vite dev proxy makes requests same-origin, but allow the dev origin
  // directly too (e.g. tools hitting :3001) with credentials.
  app.use(cors({
    origin: corsOrigin || process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(sessionSecret || process.env.SESSION_SECRET || 'local-dev-only-secret'));
  app.use(attachUser);

  app.use('/api', router);
  app.use(errorHandler);
  return app;
}
