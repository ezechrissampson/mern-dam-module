import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import DamRoutes from './routes/DamRoutes.jsx';
import Loading from './pages/status/Loading.jsx';

/**
 * Waits for AuthProvider's silent background login to resolve before
 * rendering the app, so the Media Library/Dashboard never fire API
 * calls before a session exists. This is the only thing standing
 * between opening the module and seeing the Dashboard — there is no
 * login form, just a brief loading state (typically well under a
 * second) while the background sign-in completes.
 */
function AuthGate({ children }) {
  const { loading, authError } = useAuth();

  if (loading) return <Loading />;

  if (authError) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center py-5" style={{ minHeight: '100vh' }}>
        <i className="bi bi-exclamation-triangle text-dam-secondary" style={{ fontSize: '2.5rem' }} />
        <h5 className="mt-3">Couldn't start a session automatically</h5>
        <p className="text-dam-secondary" style={{ maxWidth: 420 }}>
          {authError} Check that the server is running with AUTH_MODE=standalone and that
          VITE_STANDALONE_AUTH_EMAIL / VITE_STANDALONE_AUTH_PASSWORD match the server's
          STANDALONE_ADMIN_EMAIL / STANDALONE_ADMIN_PASSWORD.
        </p>
      </div>
    );
  }

  return children;
}

/**
 * Standalone entry component for running/demoing/testing this module on
 * its own. Includes the module's built-in AuthProvider, which signs in
 * silently in the background (see AuthContext.jsx) — opening the module
 * always lands directly on the Dashboard, with no login screen.
 *
 * HOST INTEGRATION: when embedding this module in an app that already
 * has authentication, don't render <App /> or <AuthProvider> at all —
 * import <DamRoutes /> (or individual pages/components) directly into
 * your existing, already-authenticated app tree instead, and point
 * api/client.js's setAuthTokenGetter() at your own session. See
 * README > Authentication Modes.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <AuthGate>
              <DamRoutes />
            </AuthGate>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
