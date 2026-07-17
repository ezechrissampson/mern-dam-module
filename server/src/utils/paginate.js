/**
 * Shared pagination + sorting + field-selection helper for repository
 * queries. Keeps this logic out of controllers.
 */
export function buildPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 24));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildSort(query, defaultSort = '-createdAt') {
  const sortParam = query.sort || defaultSort;
  return sortParam
    .split(',')
    .map((field) => field.trim())
    .join(' ');
}

export function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

export default buildPagination;
