/**
 * Permission keys expected from the host application's RBAC system.
 * This module does NOT implement authentication or authorization —
 * it only declares the permission strings it checks for via
 * `middlewares/permission.js`, which delegates to the host app's
 * existing `req.user.can(permission)` (or equivalent) implementation.
 *
 * See README > Integration Guide for wiring instructions.
 */
export const PERMISSIONS = Object.freeze({
  MEDIA_VIEW: 'media.view',
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_EDIT: 'media.edit',
  MEDIA_DELETE: 'media.delete',
  MEDIA_DOWNLOAD: 'media.download',
  MEDIA_MANAGE: 'media.manage',
  MEDIA_BULK: 'media.bulk',
  FOLDER_MANAGE: 'folder.manage',
  METADATA_EDIT: 'metadata.edit',
  STORAGE_SETTINGS: 'storage.settings',
});

export default PERMISSIONS;
