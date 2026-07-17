import { useEffect, useState } from 'react';
import mediaApi from '../api/mediaApi.js';
import { formatBytes, timeAgo } from '../utils/format.js';
import EmptyState from '../components/common/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

export default function RecycleBin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirm = useConfirm();

  const load = () => {
    setLoading(true);
    mediaApi
      .list({ trashed: 'true', limit: 100 })
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const restore = async (id) => {
    await mediaApi.restore(id);
    toast.success('Asset restored.');
    load();
  };

  const purge = async (id, name) => {
    const ok = await confirm({ title: 'Permanently delete?', message: `"${name}" will be permanently removed from storage. This cannot be undone.`, danger: true, confirmLabel: 'Delete forever' });
    if (!ok) return;
    await mediaApi.permanentlyDelete(id);
    toast.success('Permanently deleted.');
    load();
  };

  return (
    <div>
      <h3 className="mb-1">Recycle Bin</h3>
      <p className="text-dam-secondary mb-3">Deleted assets are retained here before permanent purge. Restore or delete forever.</p>

      {!loading && items.length === 0 && <EmptyState icon="bi-trash3" title="Recycle Bin is empty" />}

      {items.length > 0 && (
        <div className="table-responsive dam-surface">
          <table className="table align-middle mb-0">
            <thead>
              <tr className="small text-dam-secondary">
                <th>Name</th>
                <th>Size</th>
                <th>Deleted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m._id}>
                  <td>{m.displayName}</td>
                  <td className="text-dam-secondary small">{formatBytes(m.bytes)}</td>
                  <td className="text-dam-secondary small">{timeAgo(m.deletedAt)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => restore(m._id)}>
                        <i className="bi bi-arrow-counterclockwise me-1" /> Restore
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => purge(m._id, m.displayName)}>
                        <i className="bi bi-trash3 me-1" /> Delete Forever
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
