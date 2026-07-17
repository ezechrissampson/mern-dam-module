import { Router } from 'express';
import * as mediaController from '../../controllers/mediaController.js';
import { requirePermission } from '../../middlewares/permission.js';
import { upload, multerErrorHandler } from '../../middlewares/uploadMiddleware.js';
import validateRequest from '../../validators/validateRequest.js';
import {
  mediaIdParam,
  listMediaQuery,
  updateMetadataBody,
  assignTagsBody,
  moveMediaBody,
  recordUsageBody,
  bulkIdsBody,
} from '../../validators/mediaValidators.js';
import PERMISSIONS from '../../constants/permissions.js';

const router = Router();

router.get('/', requirePermission(PERMISSIONS.MEDIA_VIEW), listMediaQuery, validateRequest, mediaController.listMedia);

router.get('/favorites', requirePermission(PERMISSIONS.MEDIA_VIEW), mediaController.listFavorites);

router.get('/:id', requirePermission(PERMISSIONS.MEDIA_VIEW), mediaIdParam, validateRequest, mediaController.getMedia);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.MEDIA_EDIT),
  mediaIdParam,
  updateMetadataBody,
  validateRequest,
  mediaController.updateMedia
);

router.patch(
  '/:id/tags',
  requirePermission(PERMISSIONS.METADATA_EDIT),
  mediaIdParam,
  assignTagsBody,
  validateRequest,
  mediaController.assignTags
);

router.patch(
  '/:id/move',
  requirePermission(PERMISSIONS.MEDIA_EDIT),
  mediaIdParam,
  moveMediaBody,
  validateRequest,
  mediaController.moveMedia
);

router.post('/:id/favorite', requirePermission(PERMISSIONS.MEDIA_VIEW), mediaIdParam, validateRequest, mediaController.toggleFavorite);

router.post(
  '/:id/usage',
  requirePermission(PERMISSIONS.MEDIA_EDIT),
  mediaIdParam,
  recordUsageBody,
  validateRequest,
  mediaController.recordUsage
);
router.delete('/:id/usage', requirePermission(PERMISSIONS.MEDIA_EDIT), mediaIdParam, validateRequest, mediaController.releaseUsage);
router.get('/:id/usage', requirePermission(PERMISSIONS.MEDIA_VIEW), mediaIdParam, validateRequest, mediaController.getUsage);

router.delete('/:id', requirePermission(PERMISSIONS.MEDIA_DELETE), mediaIdParam, validateRequest, mediaController.deleteMedia);
router.post('/:id/restore', requirePermission(PERMISSIONS.MEDIA_DELETE), mediaIdParam, validateRequest, mediaController.restoreMedia);
router.delete(
  '/:id/permanent',
  requirePermission(PERMISSIONS.MEDIA_MANAGE),
  mediaIdParam,
  validateRequest,
  mediaController.permanentlyDeleteMedia
);

router.put(
  '/:id/replace',
  requirePermission(PERMISSIONS.MEDIA_EDIT),
  upload.single('file'),
  multerErrorHandler,
  mediaIdParam,
  validateRequest,
  mediaController.replaceFile
);

router.get('/:id/versions', requirePermission(PERMISSIONS.MEDIA_VIEW), mediaIdParam, validateRequest, mediaController.listVersions);
router.post(
  '/:id/versions/:versionNumber/restore',
  requirePermission(PERMISSIONS.MEDIA_EDIT),
  mediaIdParam,
  validateRequest,
  mediaController.restoreVersion
);

// --- Bulk operations ---
router.post('/bulk/delete', requirePermission(PERMISSIONS.MEDIA_BULK), bulkIdsBody, validateRequest, mediaController.bulkDelete);
router.post('/bulk/restore', requirePermission(PERMISSIONS.MEDIA_BULK), bulkIdsBody, validateRequest, mediaController.bulkRestore);
router.post('/bulk/move', requirePermission(PERMISSIONS.MEDIA_BULK), bulkIdsBody, validateRequest, mediaController.bulkMove);
router.post('/bulk/tags', requirePermission(PERMISSIONS.MEDIA_BULK), bulkIdsBody, validateRequest, mediaController.bulkAssignTags);
router.post('/bulk/archive', requirePermission(PERMISSIONS.MEDIA_BULK), bulkIdsBody, validateRequest, mediaController.bulkArchive);
router.post(
  '/bulk/export-metadata',
  requirePermission(PERMISSIONS.MEDIA_BULK),
  bulkIdsBody,
  validateRequest,
  mediaController.bulkExportMetadata
);

export default router;
