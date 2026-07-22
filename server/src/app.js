import express from 'express';
import morgan from 'morgan';
import env from './config/env.js';
import applySecurityMiddleware, { apiRateLimiter } from './middlewares/security.js';
import { normalizeUser } from './middlewares/permission.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import v1Router from './routes/v1/index.js';
import standaloneAuthRoutes from './standalone-auth/authRoutes.js';
import { standaloneAuthenticate } from './standalone-auth/authMiddleware.js';
import logger from './utils/logger.js';

/**
 * Builds and returns the Express app for the DAM module.
 *
 * STANDALONE USE (default — AUTH_MODE=standalone): call createApp() and
 * app.listen() directly (see server.js). The module manages its own
 * users and issues its own JWTs via POST /auth/register and
 * /auth/login, so the module is fully self-contained for local
 * development, demos, and unit/integration testing — no host
 * application is required.
 *
 * MOUNTED / HOST-INTEGRATED USE (AUTH_MODE=host): skip server.js and
 * createApp() entirely and mount the router into your existing app
 * instead, behind your existing auth + RBAC middleware:
 *
 *   import { damRouter, configurePermissionResolver } from 'dam-module/server';
 *   configurePermissionResolver((user, permission) => yourApp.can(user, permission));
 *   app.use('/api/v1/media-manager', existingAuthMiddleware, damRouter);
 *
 * See README > Authentication Modes and > Integration Guide.
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

  if (env.authMode === 'standalone') {
    // Self-contained auth: /auth/register, /auth/login, /auth/me, then
    // every DAM route behind a JWT check populating req.user.
    app.use(`${env.apiPrefix}/auth`, standaloneAuthRoutes);
    app.use(env.apiPrefix, standaloneAuthenticate, v1Router);
  } else {
    // host mode: createApp() assumes something upstream of this process
    // (a reverse proxy, or code you add here) already authenticates
    // requests and sets req.user. For a real integration, prefer
    // mounting `damRouter` directly into your existing Express app
    // instead of using createApp()/server.js at all — see the docstring
    // above and README > Integration Guide.
    logger.warn(
      '[app] AUTH_MODE=host with createApp(): no authentication middleware is applied here. ' +
        'This is only appropriate if something upstream already populates req.user, or if you ' +
        'are about to mount your own auth middleware before this line. For real integrations, ' +
        'prefer mounting `damRouter` directly into your host Express app instead.'
    );
    app.use(env.apiPrefix, v1Router);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export { default as damRouter } from './routes/v1/index.js';
export { configurePermissionResolver } from './middlewares/permission.js';
export { getStorageProvider } from './storage/storageFactory.js';
export * as models from './models/index.js';

export default createApp;
