import { ForbiddenError, UnauthenticatedError } from '../errors/AppError.js';

/**
 * requirePermission(permissionKey) — the integration seam between this
 * module and an authorization system.
 *
 * This file only checks permissions; it never authenticates a request.
 * By the time a request reaches DAM routes, something must have already
 * populated `req.user` (or `req.auth`):
 *   - In AUTH_MODE=standalone (default), that's this module's own
 *     `standaloneAuthenticate` JWT middleware (see
 *     standalone-auth/authMiddleware.js) — used for running/testing the
 *     module on its own, no host app required.
 *   - In AUTH_MODE=host, that's the host application's own existing
 *     auth middleware, mounted before `damRouter` — see
 *     README > Integration Guide.
 *
 * Out of the box this checks, in order:
 *   - req.user.can(permission)              // function-style RBAC
 *   - req.user.permissions.includes(perm)    // flat array of permission strings
 *   - req.user.roles includes 'admin'        // superuser convenience fallback
 *
 * Host integrations will typically instead pass a custom `resolver`
 * mapping directly to their existing authorization function, e.g.:
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
