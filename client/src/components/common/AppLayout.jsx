import { Outlet, useNavigate } from 'react-router-dom';
import DamSidebar from './DamSidebar.jsx';
import Topbar from './Topbar.jsx';

/**
 * Standalone shell used by this demo app. When integrating into an
 * existing MERN application, you will typically NOT use this layout —
 * instead render <DamSidebar /> inside your app's existing sidebar and
 * mount the DAM <Routes> inside your existing authenticated layout.
 * See README > Integration Guide.
 */
export default function AppLayout() {
  const navigate = useNavigate();
  return (
    <div className="d-flex dam-app">
      <DamSidebar />
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <Topbar onSearch={(q) => navigate(`/library?q=${encodeURIComponent(q)}`)} />
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
