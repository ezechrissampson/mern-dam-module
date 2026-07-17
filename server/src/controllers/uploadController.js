import asyncHandler from '../middlewares/asyncHandler.js';
import sendSuccess from '../utils/responseFormatter.js';
import uploadService from '../services/uploadService.js';

export const uploadSingle = asyncHandler(async (req, res) => {
  const media = await uploadService.uploadSingleFile({
    file: req.file,
    folderId: req.body.folderId || null,
    visibility: req.body.visibility,
    displayName: req.body.displayName,
    altText: req.body.altText,
    caption: req.body.caption,
    description: req.body.description,
    allowDuplicate: req.body.allowDuplicate,
    user: req.user,
  });
  sendSuccess(res, { statusCode: 201, data: media, message: 'File uploaded successfully.' });
});

export const uploadMultiple = asyncHandler(async (req, res) => {
  const results = await uploadService.uploadMultipleFiles({
    files: req.files,
    folderId: req.body.folderId || null,
    visibility: req.body.visibility,
    allowDuplicate: req.body.allowDuplicate,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: 207, // multi-status: some may have failed
    data: results,
    message: `${results.succeeded.length} uploaded, ${results.failed.length} failed.`,
  });
});
