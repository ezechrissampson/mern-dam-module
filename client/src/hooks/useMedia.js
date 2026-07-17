import { useCallback, useEffect, useState } from 'react';
import mediaApi from '../api/mediaApi.js';

/**
 * Drives the Media Library grid/list: filtering, sorting, pagination,
 * and refetching. Kept as a plain hook (no external state library) so
 * the module has zero state-management dependencies to integrate.
 */
export function useMedia(initialQuery = {}) {
  const [query, setQuery] = useState({ page: 1, limit: 30, sort: '-createdAt', ...initialQuery });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mediaApi.list(q);
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(query);
  }, [query, fetchPage]);

  const updateQuery = useCallback((patch) => {
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  const refresh = useCallback(() => fetchPage(query), [fetchPage, query]);

  return { items, meta, loading, error, query, updateQuery, refresh, setQuery };
}

export default useMedia;
