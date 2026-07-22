/**
 * Seeds a minimal folder structure + tag catalog for local development/
 * demo purposes. Run with: npm run seed
 *
 * In AUTH_MODE=standalone, also ensures the default admin account exists
 * (the same thing server.js does automatically at boot) and attributes
 * seeded records to that real account. In AUTH_MODE=host, seeded records
 * are attributed to a placeholder system id since no local user system
 * exists to attach them to.
 *
 * Does NOT seed fake media assets (those require a real upload through
 * the active storage provider), only folders and tags.
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import Folder from '../src/models/Folder.js';
import MediaTag from '../src/models/MediaTag.js';
import env from '../src/config/env.js';
import { ensureDefaultAdmin } from '../src/standalone-auth/authService.js';
import logger from '../src/utils/logger.js';

async function run() {
  await connectDB();

  let systemUserId = new mongoose.Types.ObjectId();
  if (env.authMode === 'standalone') {
    const admin = await ensureDefaultAdmin();
    systemUserId = admin._id;
  }

  const existing = await Folder.countDocuments();
  if (existing > 0) {
    logger.info('[seed] Folders already exist, skipping folder seed.');
  } else {
    const marketing = await Folder.create({
      name: 'Marketing',
      slug: 'marketing',
      path: '/marketing',
      ancestors: [],
      createdBy: systemUserId,
    });
    await Folder.create({
      name: 'Campaigns',
      slug: 'campaigns',
      path: '/marketing/campaigns',
      parent: marketing._id,
      ancestors: [marketing._id],
      createdBy: systemUserId,
    });
    await Folder.create({
      name: 'Product',
      slug: 'product',
      path: '/product',
      ancestors: [],
      createdBy: systemUserId,
    });
    logger.info('[seed] Created sample folder structure.');
  }

  const tagNames = ['banner', 'social', 'print', 'draft', 'approved'];
  for (const name of tagNames) {
    // eslint-disable-next-line no-await-in-loop
    await MediaTag.findOneAndUpdate({ name }, { $setOnInsert: { name, createdBy: systemUserId } }, { upsert: true });
  }
  logger.info('[seed] Ensured base tag catalog.');

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`[seed] Failed: ${err.message}`);
  process.exit(1);
});
