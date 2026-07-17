import { Router } from 'express';
import * as activityController from '../../controllers/activityController.js';
import { requirePermission } from '../../middlewares/permission.js';
import PERMISSIONS from '../../constants/permissions.js';

const router = Router();

router.get('/', requirePermission(PERMISSIONS.MEDIA_VIEW), activityController.listActivity);

export default router;
