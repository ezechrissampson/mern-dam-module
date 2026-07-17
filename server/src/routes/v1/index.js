import { Router } from 'express';
import mediaRoutes from './media.routes.js';
import uploadRoutes from './upload.routes.js';
import folderRoutes from './folder.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import activityRoutes from './activity.routes.js';

/**
 * Mount point for the entire DAM API surface. The host application only
 * needs to `app.use(env.apiPrefix, damRouter)` — see server.js and
 * README > Integration Guide.
 */
const router = Router();

router.use('/media', mediaRoutes);
router.use('/uploads', uploadRoutes);
router.use('/folders', folderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/activity', activityRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'DAM module is running.', timestamp: new Date().toISOString() });
});

export default router;
