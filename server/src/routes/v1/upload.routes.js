import { Router } from 'express';
import * as uploadController from '../../controllers/uploadController.js';
import { requirePermission } from '../../middlewares/permission.js';
import { uploadRateLimiter } from '../../middlewares/security.js';
import { upload, multerErrorHandler } from '../../middlewares/uploadMiddleware.js';
import validateRequest from '../../validators/validateRequest.js';
import { uploadBody } from '../../validators/uploadValidators.js';
import PERMISSIONS from '../../constants/permissions.js';

const router = Router();

router.post(
  '/single',
  uploadRateLimiter,
  requirePermission(PERMISSIONS.MEDIA_UPLOAD),
  upload.single('file'),
  multerErrorHandler,
  uploadBody,
  validateRequest,
  uploadController.uploadSingle
);

router.post(
  '/multiple',
  uploadRateLimiter,
  requirePermission(PERMISSIONS.MEDIA_UPLOAD),
  upload.array('files'),
  multerErrorHandler,
  uploadBody,
  validateRequest,
  uploadController.uploadMultiple
);

// Chunked upload endpoints — extension point for resumable large-file
// uploads (pause/resume/retry). A reference implementation strategy is
// documented in README > Extension Guide > Chunked Uploads; wire your
// preferred chunk-assembly strategy (local temp buffer
// upload, or Cloudinary large-file upload API) into these two routes.
router.post('/chunk', uploadRateLimiter, requirePermission(PERMISSIONS.MEDIA_UPLOAD), (req, res) => {
  res.status(501).json({
    success: false,
    code: 'NOT_IMPLEMENTED',
    message:
      "Chunked upload assembly is an extension point — see README > Extension Guide > Chunked Uploads for the recommended implementation (Cloudinary's large-file upload API).",
  });
});
router.post('/chunk/complete', uploadRateLimiter, requirePermission(PERMISSIONS.MEDIA_UPLOAD), (req, res) => {
  res.status(501).json({ success: false, code: 'NOT_IMPLEMENTED', message: 'See README > Extension Guide > Chunked Uploads.' });
});

export default router;
