import Media from '../models/Media.js';
import Folder from '../models/Folder.js';
import mediaService from '../services/mediaService.js';
import logger from '../utils/logger.js';

const TRASH_RETENTION_DAYS = Number(process.env.TRASH_RETENTION_DAYS || 30);

/**
 * Scheduled job: permanently purges assets that have sat in the Recycle
 * Bin longer than the retention window. Wire this into your host app's
 * cron/scheduler (node-cron, Agenda, a k8s CronJob, etc) — it is not
 * self-scheduling to avoid assuming a particular job runner.
 *
 * Example (node-cron):
 *   import cron from 'node-cron';
 *   cron.schedule('0 3 * * *', purgeExpiredTrash);
 */
export async function purgeExpiredTrash(systemUser = { _id: null }) {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await Media.find({ isDeleted: true, deletedAt: { $lte: cutoff } }).select('_id displayName');

  logger.info(`[purgeTrash] Found ${expired.length} asset(s) past the ${TRASH_RETENTION_DAYS}-day retention window.`);

  for (const asset of expired) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await mediaService.permanentlyDeleteMedia(asset._id, systemUser);
    } catch (err) {
      logger.error(`[purgeTrash] failed to purge ${asset._id}: ${err.message}`);
    }
  }

  const expiredFolders = await Folder.find({ isDeleted: true, deletedAt: { $lte: cutoff } });
  if (expiredFolders.length) {
    await Folder.deleteMany({ _id: { $in: expiredFolders.map((f) => f._id) } });
    logger.info(`[purgeTrash] Purged ${expiredFolders.length} folder(s).`);
  }

  return { purgedAssets: expired.length, purgedFolders: expiredFolders.length };
}

export default purgeExpiredTrash;
