import { getPrisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { requireAuth } from './auth.js';
import { HttpError } from './errors.js';

export function requireAdmin(getAuthClient, config = env, getDatabase = getPrisma) {
  return async (req, res, next) => {
    if (config.ADMIN_AUTH_BYPASS === 'true') {
      if (config.NODE_ENV !== 'development') throw new HttpError(503, 'Admin development bypass is forbidden outside development.');
      req.adminMode = 'development-bypass';
      return next();
    }
    return requireAuth(getAuthClient)(req, res, async () => {
      const profile = await getDatabase().profile.findUnique({ where: { id: req.auth.user.id }, select: { role: true } });
      if (profile?.role !== 'admin') throw new HttpError(403, 'Administrator access is required.');
      req.adminMode = 'protected';
      next();
    });
  };
}
