import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboardController.js';
import { requirePermission } from '../../middlewares/permission.js';
import PERMISSIONS from '../../constants/permissions.js';

const router = Router();

router.get('/stats', requirePermission(PERMISSIONS.MEDIA_VIEW), dashboardController.getStats);
router.get('/storage-chart', requirePermission(PERMISSIONS.MEDIA_VIEW), dashboardController.getStorageChart);

export default router;
