import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-5">
      <i className="bi bi-signpost-2 text-dam-secondary" style={{ fontSize: '3rem' }} />
      <h2 className="mt-3">404 — Page not found</h2>
      <p className="text-dam-secondary">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/" className="btn btn-dam-primary">Back to Dashboard</Link>
    </div>
  );
}
