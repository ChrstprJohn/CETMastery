import { z } from 'zod';
import { HttpError } from './errors.js';

export function requireAuth(getAuthClient) {
  return async (req, _res, next) => {
    const match = /^Bearer ([^\s,]+)$/i.exec(req.headers.authorization || '');
    if (!match || match[1].length > 16384) {
      throw new HttpError(401, 'A valid Bearer access token is required.');
    }

    let result;
    try {
      result = await getAuthClient().auth.getUser(match[1]);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, 'Authentication is temporarily unavailable.');
    }
    if (result.error) {
      if (!result.error.status || result.error.status >= 500 || result.error.status === 429) {
        throw new HttpError(503, 'Authentication is temporarily unavailable.');
      }
      throw new HttpError(401, 'Your session is invalid or expired. Sign in again.');
    }
    const user = result.data?.user;
    if (!user || !z.uuid().safeParse(user.id).success) {
      throw new HttpError(401, 'Your session is invalid or expired. Sign in again.');
    }
    if (user.is_anonymous || user.app_metadata?.provider !== 'google') {
      throw new HttpError(403, 'Only Google sign-in is supported.');
    }

    req.auth = { user, accessToken: match[1] };
    return next();
  };
}
