import express from 'express';
import { createAdminRouter } from './routes/admin.js';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { practiceRouter } from './routes/practice.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { createAuthRouter } from './routes/auth.js';

export function createApp(authDependencies, adminDependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use('/api/admin', express.json({ limit: '1mb' }), createAdminRouter(adminDependencies));
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'cetmastery-api' }));
  app.use('/api/auth', createAuthRouter(authDependencies));
  app.use('/api/practice', rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { message: 'Too many requests. Please try again in a minute.' } },
  }), practiceRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
