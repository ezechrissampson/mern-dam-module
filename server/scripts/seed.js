/**
 * Seeds a minimal folder structure for local development/demo purposes.
 * Run with: npm run seed
 *
 * Does NOT seed fake media assets (those require a real storage provider
 * upload), only the folder hierarchy and tag catalog.
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import Folder from '../src/models/Folder.js';
import MediaTag from '../src/models/MediaTag.js';
import logger from '../src/utils/logger.js';

const SYSTEM_USER_ID = new mongoose.Types.ObjectId();

async function run() {
  await connectDB();

  const existing = await Folder.countDocuments();
  if (existing > 0) {
    logger.info('[seed] Folders already exist, skipping folder seed.');
  } else {
    const marketing = await Folder.create({
      name: 'Marketing',
      slug: 'marketing',
      path: '/marketing',
      ancestors: [],
      createdBy: SYSTEM_USER_ID,
    });
    await Folder.create({
      name: 'Campaigns',
      slug: 'campaigns',
      path: '/marketing/campaigns',
      parent: marketing._id,
      ancestors: [marketing._id],
      createdBy: SYSTEM_USER_ID,
    });
    await Folder.create({
      name: 'Product',
      slug: 'product',
      path: '/product',
      ancestors: [],
      createdBy: SYSTEM_USER_ID,
    });
    logger.info('[seed] Created sample folder structure.');
  }

  const tagNames = ['banner', 'social', 'print', 'draft', 'approved'];
  for (const name of tagNames) {
    // eslint-disable-next-line no-await-in-loop
    await MediaTag.findOneAndUpdate({ name }, { $setOnInsert: { name, createdBy: SYSTEM_USER_ID } }, { upsert: true });
  }
  logger.info('[seed] Ensured base tag catalog.');

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`[seed] Failed: ${err.message}`);
  process.exit(1);
});
