import logger from '../utils/logger.js';
import env from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * Centralized error handler. Every route uses asyncHandler so thrown/rejected
 * errors land here instead of leaking stack traces to clients or crashing
 * the process.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : err.statusCode || 500;
  const code = isAppError ? err.code : err.code || 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error(`[error] ${req.method} ${req.originalUrl} -> ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`[error] ${req.method} ${req.originalUrl} -> ${statusCode} ${code}: ${err.message}`);
  }

  // Security-relevant failures (forbidden, unauthenticated, validation on
  // destructive routes) get written to the audit trail — fire and forget.
  if ([401, 403].includes(statusCode)) {
    recordAuditLog({
      actor: req.user?._id,
      action: `${req.method} ${req.baseUrl}${req.path}`,
      resourceType: 'http',
      statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { code },
    }).catch(() => {});
  }

  res.status(statusCode).json({
    success: false,
    code,
    message: err.message || 'An unexpected error occurred.',
    details: isAppError ? err.details : undefined,
    stack: env.isProduction ? undefined : err.stack,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export default errorHandler;
