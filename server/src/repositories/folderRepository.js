import Folder from '../models/Folder.js';
import Media from '../models/Media.js';

function baseFilter(overrides = {}) {
  return { isDeleted: false, ...overrides };
}

export async function create(data) {
  return Folder.create(data);
}

export async function findById(id) {
  return Folder.findOne(baseFilter({ _id: id }));
}

export async function findChildren(parentId) {
  return Folder.find(baseFilter({ parent: parentId || null })).sort('name');
}

export async function findByPath(path) {
  return Folder.findOne(baseFilter({ path }));
}

export async function updateById(id, updates) {
  return Folder.findOneAndUpdate(baseFilter({ _id: id }), updates, { new: true, runValidators: true });
}

export async function softDelete(id) {
  return Folder.findOneAndUpdate({ _id: id }, { isDeleted: true, deletedAt: new Date() }, { new: true });
}

export async function findDescendants(folderId) {
  return Folder.find(baseFilter({ ancestors: folderId }));
}

export async function getBreadcrumb(folder) {
  if (!folder.ancestors?.length) return [folder];
  const ancestors = await Folder.find({ _id: { $in: folder.ancestors } }).sort('path');
  return [...ancestors, folder];
}

export async function recalculateStats(folderId) {
  const stats = await Media.aggregate([
    { $match: { folder: folderId, isDeleted: false } },
    { $group: { _id: null, assetCount: { $sum: 1 }, totalBytes: { $sum: '$bytes' }, lastUploadAt: { $max: '$createdAt' } } },
  ]);
  const result = stats[0] || { assetCount: 0, totalBytes: 0, lastUploadAt: null };
  await Folder.findByIdAndUpdate(folderId, {
    'stats.assetCount': result.assetCount,
    'stats.totalBytes': result.totalBytes,
    'stats.lastUploadAt': result.lastUploadAt,
  });
  return result;
}

export default {
  create,
  findById,
  findChildren,
  findByPath,
  updateById,
  softDelete,
  findDescendants,
  getBreadcrumb,
  recalculateStats,
};
