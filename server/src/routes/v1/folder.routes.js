import { Router } from 'express';
import * as folderController from '../../controllers/folderController.js';
import { requirePermission } from '../../middlewares/permission.js';
import validateRequest from '../../validators/validateRequest.js';
import { folderIdParam, createFolderBody, renameFolderBody, moveFolderBody } from '../../validators/folderValidators.js';
import PERMISSIONS from '../../constants/permissions.js';

const router = Router();

router.get('/tree', requirePermission(PERMISSIONS.MEDIA_VIEW), folderController.getTree);
router.get('/:id/breadcrumb', requirePermission(PERMISSIONS.MEDIA_VIEW), folderIdParam, validateRequest, folderController.getBreadcrumb);

router.post('/', requirePermission(PERMISSIONS.FOLDER_MANAGE), createFolderBody, validateRequest, folderController.createFolder);
router.patch(
  '/:id/rename',
  requirePermission(PERMISSIONS.FOLDER_MANAGE),
  folderIdParam,
  renameFolderBody,
  validateRequest,
  folderController.renameFolder
);
router.patch(
  '/:id/move',
  requirePermission(PERMISSIONS.FOLDER_MANAGE),
  folderIdParam,
  moveFolderBody,
  validateRequest,
  folderController.moveFolder
);
router.post('/:id/favorite', requirePermission(PERMISSIONS.FOLDER_MANAGE), folderIdParam, validateRequest, folderController.toggleFavoriteFolder);
router.delete('/:id', requirePermission(PERMISSIONS.FOLDER_MANAGE), folderIdParam, validateRequest, folderController.deleteFolder);

export default router;
