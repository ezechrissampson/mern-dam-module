import AuditLog from '../models/AuditLog.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

/** Scheduled job: prunes AuditLog entries older than the retention policy. */
export async function purgeExpiredAuditLogs() {
  const cutoff = new Date(Date.now() - env.security.auditLogRetentionDays * 24 * 60 * 60 * 1000);
  const result = await AuditLog.deleteMany({ createdAt: { $lte: cutoff } });
  logger.info(`[purgeAuditLogs] Removed ${result.deletedCount} audit log entrie(s) older than ${env.security.auditLogRetentionDays} days.`);
  return result;
}

export default purgeExpiredAuditLogs;
