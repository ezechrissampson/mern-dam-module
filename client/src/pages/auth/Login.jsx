import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Login screen for the module's built-in standalone auth. Only relevant
 * when the backend is running with AUTH_MODE=standalone (the default —
 * see server/.env.example). When embedded in a host app with its own
 * auth (AUTH_MODE=host), this page is simply not rendered — see
 * README > Authentication Modes.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--dam-bg)' }}>
      <div className="dam-surface p-4 shadow-sm" style={{ width: 380 }}>
        <div className="d-flex align-items-center gap-2 mb-4">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 40, height: 40, background: 'var(--dam-primary)' }}
          >
            <i className="bi bi-images text-white fs-5" />
          </div>
          <div>
            <div className="fw-bold">Media Manager</div>
            <div className="text-dam-secondary small">Sign in to continue</div>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small text-dam-secondary">Email</label>
            <input type="email" required className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="mb-3">
            <label className="form-label small text-dam-secondary">Password</label>
            <input type="password" required className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-dam-primary w-100" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="text-dam-secondary small mt-3 text-center">
          Running in standalone mode. Default admin credentials come from{' '}
          <code>STANDALONE_ADMIN_EMAIL</code> / <code>STANDALONE_ADMIN_PASSWORD</code> in the server's
          <code>.env</code> (default: <code>admin@example.com</code> / <code>ChangeMe123!</code>).
        </div>
      </div>
    </div>
  );
}
