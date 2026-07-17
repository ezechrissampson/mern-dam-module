import { useCallback, useEffect, useState } from 'react';
import folderApi from '../api/folderApi.js';

export function useFolderTree() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await folderApi.tree();
      setTree(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { tree, loading, reload: load };
}

export default useFolderTree;
