import { useEffect, useState } from 'react';
import activityApi from '../api/activityApi.js';
import { formatDateTime } from '../utils/format.js';
import EmptyState from '../components/common/EmptyState.jsx';

const ACTION_ICON = {
  upload: 'bi-cloud-upload text-success',
  edit: 'bi-pencil text-info',
  delete: 'bi-trash3 text-danger',
  restore: 'bi-arrow-counterclockwise text-success',
  move: 'bi-folder-symlink text-info',
  rename: 'bi-tag text-info',
  tag: 'bi-tags text-info',
  version_restore: 'bi-clock-history text-warning',
};

export default function ActivityLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityApi
      .list({ limit: 50 })
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h3 className="mb-1">Activity Log</h3>
      <p className="text-dam-secondary mb-3">A chronological record of every action taken across the media library</p>

      {!loading && items.length === 0 && <EmptyState icon="bi-clock-history" title="No activity yet" />}

      <div className="dam-surface">
        {items.map((item) => (
          <div key={item._id} className="d-flex align-items-center gap-3 p-3 border-bottom">
            <i className={`bi ${ACTION_ICON[item.action] || 'bi-info-circle'} fs-5`} />
            <div className="flex-grow-1">
              <div className="small">{item.message}</div>
              <div className="text-dam-secondary" style={{ fontSize: '0.75rem' }}>
                {formatDateTime(item.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
