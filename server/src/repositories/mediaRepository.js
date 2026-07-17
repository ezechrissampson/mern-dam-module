import Media from '../models/Media.js';
import { ASSET_STATUS } from '../constants/fileTypes.js';
import { buildPagination, buildSort, buildMeta } from '../utils/paginate.js';

/**
 * mediaRepository — the only module allowed to build Mongoose queries
 * against the Media collection. Services call these functions instead of
 * touching the model directly, so query shape/indexing strategy can change
 * in one place.
 */

function baseFilter(overrides = {}) {
  return { isDeleted: false, status: ASSET_STATUS.ACTIVE, ...overrides };
}

export async function create(data) {
  const doc = await Media.create(data);
  return doc;
}

export async function findById(id, { includeDeleted = false } = {}) {
  const filter = includeDeleted ? { _id: id } : { _id: id, isDeleted: false };
  return Media.findOne(filter).populate('folder', 'name path').populate('tags', 'name color');
}

export async function updateById(id, updates) {
  return Media.findOneAndUpdate({ _id: id, isDeleted: false }, updates, { new: true, runValidators: true });
}

export async function softDelete(id, userId) {
  return Media.findOneAndUpdate(
    { _id: id },
    { isDeleted: true, deletedAt: new Date(), deletedBy: userId, status: ASSET_STATUS.TRASHED },
    { new: true }
  );
}

export async function restore(id) {
  return Media.findOneAndUpdate(
    { _id: id },
    { isDeleted: false, deletedAt: null, deletedBy: null, status: ASSET_STATUS.ACTIVE },
    { new: true }
  );
}

export async function permanentlyDelete(id) {
  return Media.findByIdAndDelete(id);
}

/**
 * Builds and executes the Media Library list query with filtering,
 * text search, sorting, and pagination in one pass.
 */
export async function search(query) {
  const {
    q,
    folder,
    category,
    extension,
    visibility,
    uploader,
    storageProvider,
    tags,
    minSize,
    maxSize,
    unused,
    favorite,
    dateFrom,
    dateTo,
    trashed,
  } = query;

  const filter = trashed === 'true' ? { isDeleted: true } : baseFilter();

  if (folder) filter.folder = folder === 'root' ? null : folder;
  if (category) filter.category = Array.isArray(category) ? { $in: category } : category;
  if (extension) filter.extension = Array.isArray(extension) ? { $in: extension } : extension;
  if (visibility) filter.visibility = visibility;
  if (uploader) filter.createdBy = uploader;
  if (storageProvider) filter.storageProvider = storageProvider;
  if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  if (favorite === 'true') filter.isFavorite = true;
  if (unused === 'true') filter.usageCount = 0;

  if (minSize || maxSize) {
    filter.bytes = {};
    if (minSize) filter.bytes.$gte = Number(minSize);
    if (maxSize) filter.bytes.$lte = Number(maxSize);
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  if (q) {
    filter.$text = { $search: q };
  }

  const { page, limit, skip } = buildPagination(query);
  const sort = buildSort(query);

  const [items, total] = await Promise.all([
    Media.find(filter).sort(sort).skip(skip).limit(limit).populate('folder', 'name path').populate('tags', 'name color'),
    Media.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function findDuplicateByHash(hash) {
  return Media.findOne(baseFilter({ hash }));
}

export async function bulkUpdate(ids, updates) {
  return Media.updateMany({ _id: { $in: ids }, isDeleted: false }, updates);
}

export async function bulkSoftDelete(ids, userId) {
  return Media.updateMany(
    { _id: { $in: ids } },
    { isDeleted: true, deletedAt: new Date(), deletedBy: userId, status: ASSET_STATUS.TRASHED }
  );
}

export async function aggregateDashboardStats(dateFrom) {
  return Media.aggregate([
    { $match: baseFilter() },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalAssets: { $sum: 1 },
              totalBytes: { $sum: '$bytes' },
            },
          },
        ],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 }, bytes: { $sum: '$bytes' } } }],
        uploadsToday: [
          { $match: { createdAt: { $gte: dateFrom.today } } },
          { $count: 'count' },
        ],
        uploadsThisMonth: [
          { $match: { createdAt: { $gte: dateFrom.monthStart } } },
          { $count: 'count' },
        ],
        largestFiles: [{ $sort: { bytes: -1 } }, { $limit: 10 }, { $project: { displayName: 1, bytes: 1, url: 1, category: 1 } }],
        recentUploads: [{ $sort: { createdAt: -1 } }, { $limit: 10 }],
        unusedFiles: [{ $match: { usageCount: 0 } }, { $count: 'count' }],
      },
    },
  ]);
}

export default {
  create,
  findById,
  updateById,
  softDelete,
  restore,
  permanentlyDelete,
  search,
  findDuplicateByHash,
  bulkUpdate,
  bulkSoftDelete,
  aggregateDashboardStats,
};
