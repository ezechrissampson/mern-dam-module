import Folder from '../models/Folder.js';
import folderRepository from '../repositories/folderRepository.js';
import Media from '../models/Media.js';
import { recordActivity } from './auditService.js';
import cache from '../config/redis.js';
import { slugify } from '../utils/filenameSanitizer.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError.js';

async function invalidateFolderCaches() {
  await cache.flushPattern('folders:*');
  await cache.flushPattern('media:list:*');
}

export async function createFolder({ name, parentId, description, color, icon }, user) {
  let parent = null;
  let ancestors = [];
  let parentPath = '';

  if (parentId) {
    parent = await folderRepository.findById(parentId);
    if (!parent) throw new NotFoundError('Parent folder not found.');
    ancestors = [...parent.ancestors, parent._id];
    parentPath = parent.path;
  }

  const slug = slugify(name);
  const path = `${parentPath}/${slug}`.replace(/\/+/g, '/');

  const existing = await folderRepository.findByPath(path);
  if (existing) throw new ConflictError(`A folder named "${name}" already exists in this location.`);

  const folder = await folderRepository.create({
    name,
    slug,
    parent: parentId || null,
    path,
    ancestors,
    description,
    color,
    icon,
    createdBy: user._id,
  });

  await recordActivity({ folder: folder._id, action: 'upload', message: `Folder "${name}" created`, actor: user._id });
  await invalidateFolderCaches();
  return folder;
}

export async function renameFolder(id, name, user) {
  const folder = await folderRepository.findById(id);
  if (!folder) throw new NotFoundError('Folder not found.');

  const slug = slugify(name);
  const segments = folder.path.split('/');
  segments[segments.length - 1] = slug;
  const newPath = segments.join('/');

  const conflict = await folderRepository.findByPath(newPath);
  if (conflict && String(conflict._id) !== String(id)) {
    throw new ConflictError(`A folder named "${name}" already exists in this location.`);
  }

  folder.name = name;
  folder.slug = slug;
  folder.path = newPath;
  folder.updatedBy = user._id;
  await folder.save();

  await recordActivity({ folder: folder._id, action: 'rename', message: `Renamed folder to "${name}"`, actor: user._id });
  await invalidateFolderCaches();
  return folder;
}

export async function moveFolder(id, newParentId, user) {
  const folder = await folderRepository.findById(id);
  if (!folder) throw new NotFoundError('Folder not found.');

  if (newParentId && String(newParentId) === String(id)) {
    throw new ValidationError('A folder cannot be moved into itself.');
  }

  let newParent = null;
  let newAncestors = [];
  let newParentPath = '';

  if (newParentId) {
    newParent = await folderRepository.findById(newParentId);
    if (!newParent) throw new NotFoundError('Destination folder not found.');
    if (newParent.ancestors.some((a) => String(a) === String(id))) {
      throw new ValidationError('Cannot move a folder into one of its own descendants.');
    }
    newAncestors = [...newParent.ancestors, newParent._id];
    newParentPath = newParent.path;
  }

  const oldPath = folder.path;
  const newPath = `${newParentPath}/${folder.slug}`.replace(/\/+/g, '/');

  folder.parent = newParentId || null;
  folder.ancestors = newAncestors;
  folder.path = newPath;
  folder.updatedBy = user._id;
  await folder.save();

  // Cascade path updates to descendants
  const descendants = await folderRepository.findDescendants(id);
  await Promise.all(
    descendants.map((d) => {
      d.path = d.path.replace(oldPath, newPath);
      d.ancestors = [...newAncestors, folder._id, ...d.ancestors.filter((a) => String(a) !== String(folder._id))];
      return d.save();
    })
  );

  await recordActivity({ folder: folder._id, action: 'move', message: 'Folder moved', actor: user._id });
  await invalidateFolderCaches();
  return folder;
}

export async function deleteFolder(id, user, { cascade = false } = {}) {
  const folder = await folderRepository.findById(id);
  if (!folder) throw new NotFoundError('Folder not found.');

  const assetCount = await Media.countDocuments({ folder: id, isDeleted: false });
  const childFolders = await folderRepository.findChildren(id);

  if ((assetCount > 0 || childFolders.length > 0) && !cascade) {
    throw new ConflictError(
      `This folder contains ${assetCount} asset(s) and ${childFolders.length} subfolder(s). Confirm to delete anyway.`,
      'FOLDER_NOT_EMPTY'
    );
  }

  if (cascade) {
    const descendantIds = (await folderRepository.findDescendants(id)).map((d) => d._id);
    await Media.updateMany({ folder: { $in: [id, ...descendantIds] } }, { isDeleted: true, deletedAt: new Date(), deletedBy: user._id });
    await Folder.updateMany({ _id: { $in: descendantIds } }, { isDeleted: true, deletedAt: new Date() });
  }

  await folderRepository.softDelete(id);
  await recordActivity({ folder: id, action: 'delete', message: `Deleted folder "${folder.name}"`, actor: user._id });
  await invalidateFolderCaches();
  return { deleted: true };
}

export async function getTree(rootId = null) {
  const buildBranch = async (parentId) => {
    const children = await folderRepository.findChildren(parentId);
    return Promise.all(
      children.map(async (child) => ({
        ...child.toObject(),
        children: await buildBranch(child._id),
      }))
    );
  };
  return buildBranch(rootId);
}

export async function getBreadcrumb(id) {
  const folder = await folderRepository.findById(id);
  if (!folder) throw new NotFoundError('Folder not found.');
  return folderRepository.getBreadcrumb(folder);
}

export async function toggleFavoriteFolder(id) {
  const folder = await folderRepository.findById(id);
  if (!folder) throw new NotFoundError('Folder not found.');
  folder.isFavorite = !folder.isFavorite;
  await folder.save();
  return folder;
}

export default {
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  getTree,
  getBreadcrumb,
  toggleFavoriteFolder,
};
