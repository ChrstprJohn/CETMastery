import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { practiceRouter } from './routes/practice.js';
import { errorHandler, notFound } from './middleware/errors.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '16kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'cetmastery-api' }));
app.use('/api/practice', rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many requests. Please try again in a minute.' } },
}), practiceRouter);
app.use(notFound);
app.use(errorHandler);
