import mediaRepository from '../repositories/mediaRepository.js';
import folderRepository from '../repositories/folderRepository.js';
import getStorageProvider from '../storage/storageFactory.js';
import Media from '../models/Media.js';
import MediaVersion from '../models/MediaVersion.js';
import MediaTag from '../models/MediaTag.js';
import MediaUsage from '../models/MediaUsage.js';
import MediaFavorite from '../models/MediaFavorite.js';
import { recordActivity, recordAuditLog } from './auditService.js';
import cache from '../config/redis.js';
import { NotFoundError, ConflictError } from '../errors/AppError.js';
import { validateFile } from './fileValidationService.js';
import { sanitizeFilename } from '../utils/filenameSanitizer.js';
import logger from '../utils/logger.js';

async function invalidateListCaches() {
  await cache.flushPattern('media:list:*');
  await cache.flushPattern('dashboard:*');
}

export async function getMediaById(id) {
  const media = await mediaRepository.findById(id);
  if (!media) throw new NotFoundError('Media asset not found.');
  return media;
}

export async function listMedia(query) {
  const cacheKey = `media:list:${JSON.stringify(query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const result = await mediaRepository.search(query);
  await cache.set(cacheKey, result, 60); // short TTL — library changes frequently
  return result;
}

export async function updateMetadata(id, updates, user) {
  const allowed = [
    'displayName',
    'description',
    'altText',
    'caption',
    'seoTitle',
    'copyright',
    'license',
    'photographer',
    'categories',
    'customMetadata',
    'visibility',
  ];
  const patch = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) patch[key] = updates[key];
  }
  patch.updatedBy = user._id;

  const media = await mediaRepository.updateById(id, patch);
  if (!media) throw new NotFoundError('Media asset not found.');

  await recordActivity({ media: media._id, action: 'edit', message: 'Metadata updated', actor: user._id, metadata: patch });
  await invalidateListCaches();
  return media;
}

export async function assignTags(id, tagNames, user) {
  const tagIds = await Promise.all(
    tagNames.map(async (name) => {
      const normalized = name.trim().toLowerCase();
      const tag = await MediaTag.findOneAndUpdate(
        { name: normalized },
        { $setOnInsert: { name: normalized, createdBy: user._id }, $inc: { usageCount: 1 } },
        { new: true, upsert: true }
      );
      return tag._id;
    })
  );

  const media = await mediaRepository.updateById(id, { tags: tagIds, updatedBy: user._id });
  if (!media) throw new NotFoundError('Media asset not found.');

  await recordActivity({ media: media._id, action: 'tag', message: `Tags updated`, actor: user._id, metadata: { tagNames } });
  await invalidateListCaches();
  return media;
}

export async function moveToFolder(id, folderId, user) {
  const media = await getMediaById(id);
  const previousFolder = media.folder;

  media.folder = folderId || null;
  media.updatedBy = user._id;
  await media.save();

  await Promise.all([
    previousFolder && folderRepository.recalculateStats(previousFolder),
    folderId && folderRepository.recalculateStats(folderId),
  ]);

  await recordActivity({ media: media._id, action: 'move', message: 'Moved to a different folder', actor: user._id });
  await invalidateListCaches();
  return media;
}

export async function toggleFavorite(id, user) {
  const existing = await MediaFavorite.findOne({ media: id, user: user._id });
  if (existing) {
    await existing.deleteOne();
    await Media.findByIdAndUpdate(id, { $pull: { favoritedBy: user._id } });
    return { favorited: false };
  }
  await MediaFavorite.create({ media: id, user: user._id });
  await Media.findByIdAndUpdate(id, { $addToSet: { favoritedBy: user._id }, isFavorite: true });
  return { favorited: true };
}

export async function listFavorites(user, query) {
  const favorites = await MediaFavorite.find({ user: user._id }).select('media');
  const ids = favorites.map((f) => f.media);
  return mediaRepository.search({ ...query, _idsOverride: ids });
}

/** Records that a piece of host-app content is now using this asset. */
export async function recordUsage({ mediaId, contentType, contentId, contentLabel, contentUrl, fieldName, user }) {
  const usage = await MediaUsage.findOneAndUpdate(
    { media: mediaId, contentType, contentId, fieldName },
    { contentLabel, contentUrl, linkedBy: user._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await Media.findByIdAndUpdate(mediaId, { $inc: { usageCount: 1 } });
  return usage;
}

export async function releaseUsage({ mediaId, contentType, contentId, fieldName }) {
  const deleted = await MediaUsage.findOneAndDelete({ media: mediaId, contentType, contentId, fieldName });
  if (deleted) {
    await Media.findByIdAndUpdate(mediaId, { $inc: { usageCount: -1 } });
  }
  return deleted;
}

export async function getUsage(mediaId) {
  return MediaUsage.find({ media: mediaId }).sort('-createdAt');
}

/**
 * Soft-deletes an asset. Refuses (409) if the asset is currently in use
 * unless `force` is explicitly passed — this is the "prevent accidental
 * deletion of files currently in use" requirement.
 */
export async function deleteMedia(id, user, { force = false } = {}) {
  const media = await getMediaById(id);

  if (!force && media.usageCount > 0) {
    const usages = await getUsage(id);
    throw new ConflictError(
      `This asset is currently used in ${media.usageCount} place(s) and cannot be deleted without confirmation.`,
      'ASSET_IN_USE'
    );
    // Controllers should catch ASSET_IN_USE and surface `usages` to the
    // admin as a confirmation warning, then retry with force=true.
  }

  const deleted = await mediaRepository.softDelete(id, user._id);
  if (media.folder) await folderRepository.recalculateStats(media.folder);

  await recordActivity({ media: id, action: 'delete', message: `Moved "${media.displayName}" to Recycle Bin`, actor: user._id });
  await recordAuditLog({ actor: user._id, action: 'media.delete', resourceType: 'media', resourceId: id });
  await invalidateListCaches();
  return deleted;
}

export async function restoreMedia(id, user) {
  const media = await mediaRepository.restore(id);
  if (!media) throw new NotFoundError('Media asset not found.');
  await recordActivity({ media: id, action: 'restore', message: `Restored "${media.displayName}" from Recycle Bin`, actor: user._id });
  await invalidateListCaches();
  return media;
}

/** Permanently purges an asset from storage AND the database. Irreversible. */
export async function permanentlyDeleteMedia(id, user) {
  const media = await mediaRepository.findById(id, { includeDeleted: true });
  if (!media) throw new NotFoundError('Media asset not found.');

  const provider = getStorageProvider();
  try {
    await provider.delete(media.publicId, media.resourceType);
  } catch (err) {
    logger.error(`[mediaService] storage deletion failed for ${media.publicId}: ${err.message}`);
  }

  await mediaRepository.permanentlyDelete(id);
  await MediaVersion.deleteMany({ media: id });
  await MediaFavorite.deleteMany({ media: id });
  await MediaUsage.deleteMany({ media: id });

  await recordAuditLog({ actor: user._id, action: 'media.purge', resourceType: 'media', resourceId: id });
  await invalidateListCaches();
  return { deleted: true };
}

/** Uploads a new binary for an existing asset, preserving version history. */
export async function replaceFile(id, file, user) {
  const media = await getMediaById(id);
  const validated = await validateFile(file);
  const provider = getStorageProvider();
  const { publicIdBase } = sanitizeFilename(file.originalname);

  const uploadResult = await provider.upload({
    buffer: validated.buffer,
    filename: publicIdBase,
    folder: media.folder ? String(media.folder) : '',
    mimeType: validated.mimeType,
  });

  const nextVersion = media.currentVersion + 1;

  await MediaVersion.create({
    media: media._id,
    versionNumber: nextVersion,
    publicId: uploadResult.publicId,
    url: uploadResult.url,
    secureUrl: uploadResult.secureUrl,
    bytes: validated.sizeBytes,
    width: validated.width,
    height: validated.height,
    hash: validated.hash,
    changeType: 'replace',
    changeSummary: 'File replaced',
    createdBy: user._id,
  });

  media.publicId = uploadResult.publicId;
  media.url = uploadResult.url;
  media.secureUrl = uploadResult.secureUrl;
  media.bytes = validated.sizeBytes;
  media.width = validated.width;
  media.height = validated.height;
  media.hash = validated.hash;
  media.currentVersion = nextVersion;
  media.updatedBy = user._id;
  await media.save();

  await recordActivity({ media: media._id, action: 'edit', message: `Replaced file (v${nextVersion})`, actor: user._id });
  await invalidateListCaches();
  return media;
}

export async function listVersions(mediaId) {
  return MediaVersion.find({ media: mediaId }).sort('-versionNumber');
}

export async function restoreVersion(mediaId, versionNumber, user) {
  const version = await MediaVersion.findOne({ media: mediaId, versionNumber });
  if (!version) throw new NotFoundError('Version not found.');

  const media = await getMediaById(mediaId);
  const nextVersion = media.currentVersion + 1;

  await MediaVersion.create({
    media: mediaId,
    versionNumber: nextVersion,
    publicId: version.publicId,
    url: version.url,
    secureUrl: version.secureUrl,
    bytes: version.bytes,
    width: version.width,
    height: version.height,
    hash: version.hash,
    changeType: 'restore',
    changeSummary: `Restored from v${versionNumber}`,
    createdBy: user._id,
  });

  media.publicId = version.publicId;
  media.url = version.url;
  media.secureUrl = version.secureUrl;
  media.bytes = version.bytes;
  media.width = version.width;
  media.height = version.height;
  media.hash = version.hash;
  media.currentVersion = nextVersion;
  media.updatedBy = user._id;
  await media.save();

  await recordActivity({ media: mediaId, action: 'version_restore', message: `Rolled back to v${versionNumber}`, actor: user._id });
  await invalidateListCaches();
  return media;
}

// --- Bulk operations ---

export async function bulkDelete(ids, user, { force = false } = {}) {
  if (!force) {
    const inUse = await Media.find({ _id: { $in: ids }, usageCount: { $gt: 0 } }).select('displayName usageCount');
    if (inUse.length) {
      throw new ConflictError(
        `${inUse.length} of the selected assets are currently in use. Confirm to delete anyway.`,
        'ASSET_IN_USE'
      );
    }
  }
  const result = await mediaRepository.bulkSoftDelete(ids, user._id);
  await recordAuditLog({ actor: user._id, action: 'media.bulkDelete', resourceType: 'media', metadata: { ids } });
  await invalidateListCaches();
  return result;
}

export async function bulkMove(ids, folderId, user) {
  const result = await mediaRepository.bulkUpdate(ids, { folder: folderId || null, updatedBy: user._id });
  if (folderId) await folderRepository.recalculateStats(folderId);
  await invalidateListCaches();
  return result;
}

export async function bulkAssignTags(ids, tagNames, user) {
  const tagIds = await Promise.all(
    tagNames.map(async (name) => {
      const normalized = name.trim().toLowerCase();
      const tag = await MediaTag.findOneAndUpdate(
        { name: normalized },
        { $setOnInsert: { name: normalized, createdBy: user._id } },
        { new: true, upsert: true }
      );
      return tag._id;
    })
  );
  const result = await mediaRepository.bulkUpdate(ids, { $addToSet: { tags: { $each: tagIds } }, updatedBy: user._id });
  await invalidateListCaches();
  return result;
}

export async function bulkExportMetadata(ids) {
  const items = await Media.find({ _id: { $in: ids } }).populate('tags', 'name');
  return items.map((m) => ({
    id: m._id,
    displayName: m.displayName,
    description: m.description,
    altText: m.altText,
    caption: m.caption,
    tags: m.tags.map((t) => t.name),
    url: m.secureUrl,
    bytes: m.bytes,
    mimeType: m.mimeType,
    createdAt: m.createdAt,
  }));
}

export async function bulkArchive(ids, user, archive = true) {
  const result = await mediaRepository.bulkUpdate(ids, { status: archive ? 'archived' : 'active', updatedBy: user._id });
  await invalidateListCaches();
  return result;
}

export default {
  getMediaById,
  listMedia,
  updateMetadata,
  assignTags,
  moveToFolder,
  toggleFavorite,
  listFavorites,
  recordUsage,
  releaseUsage,
  getUsage,
  deleteMedia,
  restoreMedia,
  permanentlyDeleteMedia,
  replaceFile,
  listVersions,
  restoreVersion,
  bulkDelete,
  bulkMove,
  bulkAssignTags,
  bulkExportMetadata,
  bulkArchive,
};
