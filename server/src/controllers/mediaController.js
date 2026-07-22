import asyncHandler from '../middlewares/asyncHandler.js';
import sendSuccess from '../utils/responseFormatter.js';
import mediaService from '../services/mediaService.js';
import { buildMetadataWorkbook } from '../utils/xlsxExport.js';

export const listMedia = asyncHandler(async (req, res) => {
  const { items, meta } = await mediaService.listMedia(req.query);
  sendSuccess(res, { data: items, meta });
});

export const getMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.getMediaById(req.params.id);
  sendSuccess(res, { data: media });
});

export const updateMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.updateMetadata(req.params.id, req.body, req.user);
  sendSuccess(res, { data: media, message: 'Media updated successfully.' });
});

export const assignTags = asyncHandler(async (req, res) => {
  const media = await mediaService.assignTags(req.params.id, req.body.tags, req.user);
  sendSuccess(res, { data: media, message: 'Tags updated.' });
});

export const moveMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.moveToFolder(req.params.id, req.body.folderId, req.user);
  sendSuccess(res, { data: media, message: 'Media moved.' });
});

export const toggleFavorite = asyncHandler(async (req, res) => {
  const result = await mediaService.toggleFavorite(req.params.id, req.user);
  sendSuccess(res, { data: result });
});

export const listFavorites = asyncHandler(async (req, res) => {
  const { items, meta } = await mediaService.listFavorites(req.user, req.query);
  sendSuccess(res, { data: items, meta });
});

export const recordUsage = asyncHandler(async (req, res) => {
  const usage = await mediaService.recordUsage({ mediaId: req.params.id, ...req.body, user: req.user });
  sendSuccess(res, { statusCode: 201, data: usage });
});

export const releaseUsage = asyncHandler(async (req, res) => {
  const result = await mediaService.releaseUsage({ mediaId: req.params.id, ...req.body });
  sendSuccess(res, { data: result });
});

export const getUsage = asyncHandler(async (req, res) => {
  const usage = await mediaService.getUsage(req.params.id);
  sendSuccess(res, { data: usage });
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const force = req.query.force === 'true';
  const media = await mediaService.deleteMedia(req.params.id, req.user, { force });
  sendSuccess(res, { data: media, message: 'Media moved to Recycle Bin.' });
});

export const restoreMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.restoreMedia(req.params.id, req.user);
  sendSuccess(res, { data: media, message: 'Media restored.' });
});

export const permanentlyDeleteMedia = asyncHandler(async (req, res) => {
  await mediaService.permanentlyDeleteMedia(req.params.id, req.user);
  sendSuccess(res, { message: 'Media permanently deleted.' });
});

export const replaceFile = asyncHandler(async (req, res) => {
  const media = await mediaService.replaceFile(req.params.id, req.file, req.user);
  sendSuccess(res, { data: media, message: 'File replaced. A new version has been recorded.' });
});

export const listVersions = asyncHandler(async (req, res) => {
  const versions = await mediaService.listVersions(req.params.id);
  sendSuccess(res, { data: versions });
});

export const restoreVersion = asyncHandler(async (req, res) => {
  const media = await mediaService.restoreVersion(req.params.id, Number(req.params.versionNumber), req.user);
  sendSuccess(res, { data: media, message: 'Version restored.' });
});

// --- Bulk ---

export const bulkDelete = asyncHandler(async (req, res) => {
  const force = req.body.force === true;
  const result = await mediaService.bulkDelete(req.body.ids, req.user, { force });
  sendSuccess(res, { data: result, message: 'Selected assets moved to Recycle Bin.' });
});

export const bulkMove = asyncHandler(async (req, res) => {
  const result = await mediaService.bulkMove(req.body.ids, req.body.folderId, req.user);
  sendSuccess(res, { data: result, message: 'Selected assets moved.' });
});

export const bulkAssignTags = asyncHandler(async (req, res) => {
  const result = await mediaService.bulkAssignTags(req.body.ids, req.body.tags, req.user);
  sendSuccess(res, { data: result, message: 'Tags assigned to selected assets.' });
});

export const bulkExportMetadata = asyncHandler(async (req, res) => {
  const rows = await mediaService.bulkExportMetadata(req.body.ids);
  const buffer = await buildMetadataWorkbook(rows);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="media-metadata-export.xlsx"');
  res.send(Buffer.from(buffer));
});

export const bulkArchive = asyncHandler(async (req, res) => {
  const result = await mediaService.bulkArchive(req.body.ids, req.user, req.body.archive !== false);
  sendSuccess(res, { data: result, message: 'Archive status updated.' });
});

export const bulkRestore = asyncHandler(async (req, res) => {
  const results = await Promise.all(req.body.ids.map((id) => mediaService.restoreMedia(id, req.user)));
  sendSuccess(res, { data: results, message: 'Selected assets restored.' });
});
