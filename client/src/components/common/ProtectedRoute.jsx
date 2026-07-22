import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Loading from '../../pages/status/Loading.jsx';

/**
 * Gates the DAM UI behind a logged-in session. Only meaningful when
 * this module's own AuthProvider/standalone auth is in use — a host
 * app embedding this module behind its own auth system will typically
 * render its DAM routes without this wrapper at all (its own route
 * guard already covers it). See README > Authentication Modes.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}
