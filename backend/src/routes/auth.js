import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { getSupabaseAuth } from '../services/supabase.js';
import { getPrisma } from '../lib/prisma.js';
import { ensureProfile } from '../services/profiles.js';

export function createAuthRouter({ getAuthClient = getSupabaseAuth, getDatabase = getPrisma } = {}) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(rateLimit({
    windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { message: 'Too many auth requests. Please try again in a minute.' } },
  }));
  router.use(requireAuth(getAuthClient));

  router.post('/session', async (req, res) => {
    if (!z.object({}).strict().safeParse(req.body ?? {}).success) {
      throw new HttpError(400, 'This endpoint does not accept profile or identity fields.');
    }
    const profile = await ensureProfile(getDatabase(), req.auth.user);
    res.json({ data: { user: publicUser(req.auth.user), profile } });
  });

  router.get('/me', async (req, res) => {
    const profile = await getDatabase().profile.findUnique({ where: { id: req.auth.user.id } });
    res.json({ data: { user: publicUser(req.auth.user), profile } });
  });

  router.post('/logout', async (req, res) => {
    try {
      const { error } = await getAuthClient().auth.admin.signOut(req.auth.accessToken, 'local');
      if (error) throw error;
    } catch {
      throw new HttpError(503, 'Sign-out could not complete. Please try again.');
    }
    res.status(204).end();
  });
  return router;
}

function publicUser(user) {
  return { id: user.id, email: user.email ?? null, provider: 'google' };
}
