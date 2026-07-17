import AuditLog from '../models/AuditLog.js';
import MediaActivity from '../models/MediaActivity.js';
import logger from '../utils/logger.js';

/** Security/compliance audit trail. Never throws — a logging failure must not break the request. */
export async function recordAuditLog(entry) {
  try {
    await AuditLog.create(entry);
  } catch (err) {
    logger.error(`[audit] failed to write audit log: ${err.message}`);
  }
}

/** Human-readable activity feed for the Activity Log page / media details drawer. */
export async function recordActivity({ media, folder, action, message, metadata, actor }) {
  try {
    await MediaActivity.create({ media, folder, action, message, metadata, actor });
  } catch (err) {
    logger.error(`[activity] failed to write activity: ${err.message}`);
  }
}

export async function listActivity({ media, folder, page = 1, limit = 30 }) {
  const filter = {};
  if (media) filter.media = media;
  if (folder) filter.folder = folder;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    MediaActivity.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('media', 'displayName url'),
    MediaActivity.countDocuments(filter),
  ]);
  return { items, total };
}

export default { recordAuditLog, recordActivity, listActivity };
