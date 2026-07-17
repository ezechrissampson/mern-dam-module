import asyncHandler from '../middlewares/asyncHandler.js';
import sendSuccess from '../utils/responseFormatter.js';
import folderService from '../services/folderService.js';

export const createFolder = asyncHandler(async (req, res) => {
  const folder = await folderService.createFolder(req.body, req.user);
  sendSuccess(res, { statusCode: 201, data: folder, message: 'Folder created.' });
});

export const renameFolder = asyncHandler(async (req, res) => {
  const folder = await folderService.renameFolder(req.params.id, req.body.name, req.user);
  sendSuccess(res, { data: folder, message: 'Folder renamed.' });
});

export const moveFolder = asyncHandler(async (req, res) => {
  const folder = await folderService.moveFolder(req.params.id, req.body.parentId, req.user);
  sendSuccess(res, { data: folder, message: 'Folder moved.' });
});

export const deleteFolder = asyncHandler(async (req, res) => {
  const cascade = req.query.cascade === 'true';
  const result = await folderService.deleteFolder(req.params.id, req.user, { cascade });
  sendSuccess(res, { data: result, message: 'Folder deleted.' });
});

export const getTree = asyncHandler(async (req, res) => {
  const tree = await folderService.getTree(req.query.rootId || null);
  sendSuccess(res, { data: tree });
});

export const getBreadcrumb = asyncHandler(async (req, res) => {
  const breadcrumb = await folderService.getBreadcrumb(req.params.id);
  sendSuccess(res, { data: breadcrumb });
});

export const toggleFavoriteFolder = asyncHandler(async (req, res) => {
  const folder = await folderService.toggleFavoriteFolder(req.params.id);
  sendSuccess(res, { data: folder });
});
