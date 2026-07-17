/**
 * Idempotent index/setup migration script.
 * Run with: npm run migrate
 *
 * Mongoose's autoIndex will build most of these automatically on model
 * registration in development, but running an explicit migration is the
 * recommended production pattern (autoIndex should be disabled in prod).
 */
import { connectDB, disconnectDB } from '../src/config/db.js';
import '../src/models/index.js';
import mongoose from 'mongoose';
import logger from '../src/utils/logger.js';

async function run() {
  await connectDB();
  logger.info('[migrate] Syncing indexes for all registered models...');

  for (const modelName of mongoose.modelNames()) {
    const model = mongoose.model(modelName);
    // eslint-disable-next-line no-await-in-loop
    await model.syncIndexes();
    logger.info(`[migrate] Synced indexes for ${modelName}`);
  }

  logger.info('[migrate] Done.');
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`[migrate] Failed: ${err.message}`);
  process.exit(1);
});
