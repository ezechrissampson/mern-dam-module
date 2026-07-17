import mediaRepository from '../repositories/mediaRepository.js';
import Folder from '../models/Folder.js';
import Media from '../models/Media.js';
import getStorageProvider, { listRegisteredProviders } from '../storage/storageFactory.js';
import cache from '../config/redis.js';
import env from '../config/env.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Aggregates every metric shown on the Dashboard page. Cached briefly in
 * Redis (or the no-op cache in dev) since this touches several collections
 * and is read on every dashboard page load.
 */
export async function getDashboardStats() {
  const cacheKey = 'dashboard:stats';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [facetResult, folderCount, orphanedCount] = await Promise.all([
    mediaRepository.aggregateDashboardStats({ today: startOfToday(), monthStart: startOfMonth() }),
    Folder.countDocuments({ isDeleted: false }),
    Media.countDocuments({ isDeleted: false, folder: null }),
  ]);

  const facet = facetResult[0] || {};
  const totals = facet.totals?.[0] || { totalAssets: 0, totalBytes: 0 };
  const byCategory = Object.fromEntries((facet.byCategory || []).map((c) => [c._id, { count: c.count, bytes: c.bytes }]));

  const provider = getStorageProvider();
  const providerHealth = await provider.healthCheck().catch((err) => ({ status: 'unhealthy', error: err.message }));

  const stats = {
    totals: {
      totalAssets: totals.totalAssets,
      images: byCategory.image?.count || 0,
      documents: byCategory.document?.count || 0,
      videos: byCategory.video?.count || 0, // future-ready
      audio: byCategory.audio?.count || 0, // future-ready
      folders: folderCount,
      storageUsedBytes: totals.totalBytes,
      uploadsToday: facet.uploadsToday?.[0]?.count || 0,
      uploadsThisMonth: facet.uploadsThisMonth?.[0]?.count || 0,
      unusedFiles: facet.unusedFiles?.[0]?.count || 0,
      orphanedFiles: orphanedCount,
    },
    recentUploads: facet.recentUploads || [],
    largestFiles: facet.largestFiles || [],
    storageProvider: {
      active: env.storage.provider,
      registered: listRegisteredProviders(),
      health: providerHealth,
    },
  };

  await cache.set(cacheKey, stats, 60);
  return stats;
}

/** Data shaped for the dashboard's storage-by-category chart. */
export async function getStorageBreakdownChart() {
  const stats = await getDashboardStats();
  return {
    labels: ['Images', 'Documents', 'Videos', 'Audio'],
    values: [stats.totals.images, stats.totals.documents, stats.totals.videos, stats.totals.audio],
  };
}

export default { getDashboardStats, getStorageBreakdownChart };
