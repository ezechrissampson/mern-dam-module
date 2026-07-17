import { Link } from 'react-router-dom';
import useDashboardStats from '../hooks/useDashboardStats.js';
import StatCard from '../components/dashboard/StatCard.jsx';
import CategoryBarChart from '../components/dashboard/CategoryBarChart.jsx';
import { formatBytes, timeAgo } from '../utils/format.js';

export default function Dashboard() {
  const { stats, loading, reload } = useDashboardStats();

  if (loading || !stats) {
    return (
      <div className="row g-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="col-6 col-lg-3" key={i}>
            <div className="dam-skeleton" style={{ height: 90 }} />
          </div>
        ))}
      </div>
    );
  }

  const { totals, recentUploads, largestFiles, storageProvider } = stats;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-0">Dashboard</h3>
          <p className="text-dam-secondary mb-0">Overview of your digital asset library</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/upload" className="btn btn-dam-primary">
            <i className="bi bi-cloud-upload me-2" /> Quick Upload
          </Link>
          <Link to="/folders" className="btn btn-outline-secondary">
            <i className="bi bi-folder-plus me-2" /> New Folder
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-collection" label="Total Assets" value={totals.totalAssets} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-image" label="Images" value={totals.images} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-file-earmark-text" label="Documents" value={totals.documents} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-folder2-open" label="Folders" value={totals.folders} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-hdd" label="Storage Used" value={formatBytes(totals.storageUsedBytes)} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-calendar-day" label="Uploads Today" value={totals.uploadsToday} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-calendar-month" label="Uploads This Month" value={totals.uploadsThisMonth} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-exclamation-triangle" label="Unused Files" value={totals.unusedFiles} variant="warning" />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="dam-surface p-3 mb-3">
            <h6>Storage Breakdown</h6>
            <CategoryBarChart labels={['Images', 'Documents', 'Videos', 'Audio']} values={[totals.images, totals.documents, totals.videos, totals.audio]} />
          </div>

          <div className="dam-surface p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Storage Provider Status</h6>
              <button className="btn btn-sm btn-link" onClick={reload}>
                Refresh
              </button>
            </div>
            <div className="d-flex align-items-center justify-content-between">
              <span className="text-capitalize">{storageProvider.active}</span>
              <span className={`badge ${storageProvider.health?.status === 'healthy' ? 'bg-success' : 'bg-danger'}`}>
                {storageProvider.health?.status || 'unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="dam-surface p-3 mb-3">
            <h6>Recent Uploads</h6>
            <table className="table table-sm align-middle mb-0">
              <tbody>
                {recentUploads.map((m) => (
                  <tr key={m._id}>
                    <td className="text-truncate" style={{ maxWidth: 220 }}>
                      {m.displayName}
                    </td>
                    <td className="text-dam-secondary small">{formatBytes(m.bytes)}</td>
                    <td className="text-dam-secondary small">{timeAgo(m.createdAt)}</td>
                  </tr>
                ))}
                {recentUploads.length === 0 && (
                  <tr>
                    <td className="text-dam-secondary small">No uploads yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="dam-surface p-3">
            <h6>Largest Files</h6>
            <table className="table table-sm align-middle mb-0">
              <tbody>
                {largestFiles.map((m) => (
                  <tr key={m._id}>
                    <td className="text-truncate" style={{ maxWidth: 220 }}>
                      {m.displayName}
                    </td>
                    <td className="text-dam-secondary small text-capitalize">{m.category}</td>
                    <td className="text-dam-secondary small">{formatBytes(m.bytes)}</td>
                  </tr>
                ))}
                {largestFiles.length === 0 && (
                  <tr>
                    <td className="text-dam-secondary small">No files yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
