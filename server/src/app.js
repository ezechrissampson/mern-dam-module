import express from 'express';
import morgan from 'morgan';
import env from './config/env.js';
import applySecurityMiddleware, { apiRateLimiter } from './middlewares/security.js';
import { normalizeUser } from './middlewares/permission.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import v1Router from './routes/v1/index.js';
import logger from './utils/logger.js';

/**
 * Builds and returns the Express app for the DAM module.
 *
 * STANDALONE USE: call createApp() and app.listen() directly (see server.js).
 *
 * MOUNTED USE (recommended for most integrations): skip server.js entirely
 * and mount the router into your existing app instead:
 *
 *   import { damRouter, configurePermissionResolver } from 'dam-module/server';
 *   configurePermissionResolver((user, permission) => yourApp.can(user, permission));
 *   app.use('/api/v1/media-manager', existingAuthMiddleware, damRouter);
 *
 * See README > Integration Guide for the full walkthrough.
 */
export function createApp() {
  const app = express();

  applySecurityMiddleware(app);

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  if (!env.isProduction) {
    app.use(morgan('dev'));
  }

  app.use(normalizeUser);
  app.use(env.apiPrefix, apiRateLimiter);

  // NOTE: In a mounted integration, replace this stub with the host app's
  // real authentication middleware BEFORE the DAM router, e.g.:
  //   app.use(env.apiPrefix, hostAuthMiddleware, hostRbacMiddleware, v1Router);
  app.use(env.apiPrefix, v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export { default as damRouter } from './routes/v1/index.js';
export { configurePermissionResolver } from './middlewares/permission.js';
export { getStorageProvider } from './storage/storageFactory.js';
export * as models from './models/index.js';

export default createApp;
