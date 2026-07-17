import { ForbiddenError, UnauthenticatedError } from '../errors/AppError.js';

/**
 * requirePermission(permissionKey) — the integration seam between this
 * module and the host application's existing RBAC/authorization system.
 *
 * This module does NOT implement authentication or authorization itself.
 * It expects that by the time a request reaches DAM routes:
 *   1. The host app's auth middleware has already run and populated
 *      `req.user` (or `req.auth`).
 *   2. `req.user` exposes a way to check permissions.
 *
 * Out of the box this checks, in order:
 *   - req.user.can(permission)              // function-style RBAC
 *   - req.user.permissions.includes(perm)    // flat array of permission strings
 *   - req.user.roles includes 'admin'        // superuser convenience fallback
 *
 * Most integrations will instead pass a custom `resolver` (see
 * README > Integration Guide) mapping directly to their existing
 * authorization function, e.g.:
 *
 *   import { can } from '../../../auth/rbac.js';
 *   configurePermissionResolver((user, permission) => can(user, permission));
 */
let resolver = defaultResolver;

function defaultResolver(user, permission) {
  if (!user) return false;
  if (typeof user.can === 'function') return user.can(permission);
  if (Array.isArray(user.permissions)) return user.permissions.includes(permission);
  if (Array.isArray(user.roles) && user.roles.includes('admin')) return true;
  return false;
}

export function configurePermissionResolver(customResolver) {
  resolver = customResolver;
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user || req.auth;
    if (!user) {
      return next(new UnauthenticatedError('Authentication is required to access media resources.'));
    }
    if (!resolver(user, permission)) {
      return next(new ForbiddenError(`Missing required permission: ${permission}`));
    }
    return next();
  };
}

/** Attaches req.user from req.auth for handlers that expect req.user uniformly. */
export function normalizeUser(req, _res, next) {
  if (!req.user && req.auth) req.user = req.auth;
  next();
}

export default requirePermission;
