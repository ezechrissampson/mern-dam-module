import { verifyToken } from './authService.js';
import StandaloneUser from './StandaloneUser.js';
import { UnauthenticatedError } from '../errors/AppError.js';

/**
 * Populates req.user from a Bearer JWT issued by this module's own
 * /auth/login endpoint. Only mounted when AUTH_MODE=standalone — in
 * "host" mode, the host application's own auth middleware runs instead
 * and this file is never imported (see app.js).
 */
export async function standaloneAuthenticate(req, _res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new UnauthenticatedError('Authentication is required to access media resources.'));
  }

  try {
    const payload = verifyToken(token);
    const user = await StandaloneUser.findById(payload.sub);
    if (!user) {
      return next(new UnauthenticatedError('This account no longer exists.'));
    }
    req.user = user.toSafeJSON();
    return next();
  } catch (err) {
    return next(new UnauthenticatedError('Your session has expired or is invalid. Please log in again.'));
  }
}

export default standaloneAuthenticate;
