/**
 * Canonical file-type taxonomy used across models, filters, and the UI.
 * Extend `MIME_CATEGORY_MAP` to add support for new formats — the rest
 * of the system (dashboard counts, filters, icons) derives from this map.
 */
export const ASSET_CATEGORY = Object.freeze({
  IMAGE: 'image',
  DOCUMENT: 'document',
  VIDEO: 'video', // future-ready
  AUDIO: 'audio', // future-ready
  ARCHIVE: 'archive',
  OTHER: 'other',
});

export const MIME_CATEGORY_MAP = {
  'image/jpeg': ASSET_CATEGORY.IMAGE,
  'image/png': ASSET_CATEGORY.IMAGE,
  'image/webp': ASSET_CATEGORY.IMAGE,
  'image/gif': ASSET_CATEGORY.IMAGE,
  'image/avif': ASSET_CATEGORY.IMAGE,
  'image/svg+xml': ASSET_CATEGORY.IMAGE,
  'application/pdf': ASSET_CATEGORY.DOCUMENT,
  'application/msword': ASSET_CATEGORY.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ASSET_CATEGORY.DOCUMENT,
  'application/vnd.ms-excel': ASSET_CATEGORY.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ASSET_CATEGORY.DOCUMENT,
  'application/vnd.ms-powerpoint': ASSET_CATEGORY.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ASSET_CATEGORY.DOCUMENT,
  'text/plain': ASSET_CATEGORY.DOCUMENT,
  'text/csv': ASSET_CATEGORY.DOCUMENT,
  'application/json': ASSET_CATEGORY.DOCUMENT,
  'application/zip': ASSET_CATEGORY.ARCHIVE,
  'application/x-zip-compressed': ASSET_CATEGORY.ARCHIVE,
  'video/mp4': ASSET_CATEGORY.VIDEO,
  'video/quicktime': ASSET_CATEGORY.VIDEO,
  'video/webm': ASSET_CATEGORY.VIDEO,
  'audio/mpeg': ASSET_CATEGORY.AUDIO,
  'audio/wav': ASSET_CATEGORY.AUDIO,
  'audio/ogg': ASSET_CATEGORY.AUDIO,
};

export function categoryFromMime(mimeType) {
  return MIME_CATEGORY_MAP[mimeType] || ASSET_CATEGORY.OTHER;
}

export const VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  PRIVATE: 'private',
  PROTECTED: 'protected',
});

export const ASSET_STATUS = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  TRASHED: 'trashed', // soft-deleted, recoverable from Recycle Bin
});
