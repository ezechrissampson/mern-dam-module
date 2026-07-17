import env from './config/env.js';
import { connectDB } from './config/db.js';
import createApp from './app.js';
import logger from './utils/logger.js';
import './models/index.js'; // register all models

async function start() {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`[server] DAM module listening on port ${env.port} (${env.nodeEnv})`);
    logger.info(`[server] API base: ${env.appUrl}${env.apiPrefix}`);
    logger.info(`[server] Storage provider: ${env.storage.provider}`);
  });

  const shutdown = (signal) => {
    logger.info(`[server] Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      logger.info('[server] HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`[process] Unhandled rejection: ${reason}`);
  });
  process.on('uncaughtException', (err) => {
    logger.error(`[process] Uncaught exception: ${err.message}`, { stack: err.stack });
    process.exit(1);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
