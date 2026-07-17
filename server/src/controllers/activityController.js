import asyncHandler from '../middlewares/asyncHandler.js';
import sendSuccess from '../utils/responseFormatter.js';
import auditService from '../services/auditService.js';

export const listActivity = asyncHandler(async (req, res) => {
  const { items, total } = await auditService.listActivity({
    media: req.query.media,
    folder: req.query.folder,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 30,
  });
  sendSuccess(res, { data: items, meta: { total } });
});
