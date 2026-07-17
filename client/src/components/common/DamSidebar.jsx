import { NavLink } from 'react-router-dom';

/**
 * DamSidebar — drop this into the host application's own sidebar as the
 * "Media Manager" section (or render it standalone, as this demo app
 * does in AppLayout.jsx). It only needs React Router's <NavLink>; it has
 * no dependency on the rest of the host app's navigation structure.
 */
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/library', label: 'Media Library', icon: 'bi-grid-3x3-gap' },
  { to: '/folders', label: 'Folders', icon: 'bi-folder2-open' },
  { to: '/upload', label: 'Upload Manager', icon: 'bi-cloud-upload' },
  { to: '/favorites', label: 'Favorites', icon: 'bi-star' },
  { to: '/bulk', label: 'Bulk Operations', icon: 'bi-ui-checks-grid' },
  { to: '/activity', label: 'Activity Log', icon: 'bi-clock-history' },
  { to: '/recycle-bin', label: 'Recycle Bin', icon: 'bi-trash3' },
  { to: '/storage-providers', label: 'Storage Providers', icon: 'bi-cloud' },
  { to: '/cloudinary-settings', label: 'Cloudinary Settings', icon: 'bi-gear' },
];

export default function DamSidebar() {
  return (
    <aside className="dam-sidebar d-flex flex-column p-3">
      <div className="d-flex align-items-center gap-2 mb-4 px-1">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{ width: 36, height: 36, background: 'var(--dam-primary)' }}
        >
          <i className="bi bi-images text-white fs-5" />
        </div>
        <div>
          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
            Media Manager
          </div>
          <div className="text-dam-secondary" style={{ fontSize: '0.7rem' }}>
            Digital Asset Management
          </div>
        </div>
      </div>

      <nav className="nav flex-column gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
