import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { runMigrations } from './db/migrate.js';
import { allowedOrigins, resolveSessionSecret, IS_PRODUCTION } from './lib/config.js';
import { attachUser } from './middleware/auth.js';
import { verifyOrigin } from './middleware/originCheck.js';
import { errorHandler } from './middleware/errors.js';
import router from './routes/index.js';

export function createApp({ sessionSecret, corsOrigin } = {}) {
  runMigrations();

  const app = express();
  app.disable('x-powered-by');
  // Rate limiting keys on req.ip; behind a proxy that is the proxy without this.
  app.set('trust proxy', 1);

  // Standard protective headers. This process serves JSON only, never HTML,
  // so a Content Security Policy here would have nothing to protect and would
  // risk interfering with the Vite dev server that does serve the app.
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  }));

  // The Vite dev proxy makes requests same-origin, but allow the dev origin
  // directly too (e.g. tools hitting :3001) with credentials.
  app.use(cors({
    origin: corsOrigin ? [corsOrigin] : allowedOrigins(),
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(sessionSecret || resolveSessionSecret()));
  app.use(verifyOrigin);
  app.use(attachUser);

  app.use('/api', router);
  app.use(errorHandler);

  if (IS_PRODUCTION) console.log('[server] running with production cookie and secret rules');
  return app;
}
