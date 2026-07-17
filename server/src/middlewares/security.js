import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

/**
 * Applies OWASP-aligned baseline hardening. Mount early in the middleware
 * chain, before routes. This module is intentionally self-contained so the
 * host application's own security middleware (if any) is unaffected —
 * duplicate helmet/cors calls are harmless.
 */
export function applySecurityMiddleware(app) {
  app.set('trust proxy', env.security.trustProxy);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.isProduction
        ? undefined // host app should own CSP at the top level in production
        : false,
    })
  );

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    })
  );

  app.use(compression());

  // Strips any keys starting with "$" or containing "." from req.body/query/params
  // to prevent MongoDB operator injection.
  app.use(
    mongoSanitize({
      replaceWith: '_',
    })
  );

  // HTTP Parameter Pollution protection — collapses duplicate query params.
  app.use(
    hpp({
      whitelist: ['tags', 'categories', 'fields', 'sort'], // params intentionally allowed to repeat
    })
  );
}

/** General API rate limiter. */
export const apiRateLimiter = rateLimit({
  windowMs: env.security.rateLimitWindowMinutes * 60 * 1000,
  max: env.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
});

/** Stricter limiter specifically for upload endpoints (expensive operations). */
export const uploadRateLimiter = rateLimit({
  windowMs: env.security.rateLimitWindowMinutes * 60 * 1000,
  max: env.security.uploadRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Upload rate limit exceeded, please slow down.' },
});

export default applySecurityMiddleware;
