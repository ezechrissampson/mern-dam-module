import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="text-center py-5">
      <i className="bi bi-shield-lock text-dam-secondary" style={{ fontSize: '3rem' }} />
      <h2 className="mt-3">403 — Access denied</h2>
      <p className="text-dam-secondary">You don't have the required permission to view this resource.</p>
      <Link to="/" className="btn btn-dam-primary">Back to Dashboard</Link>
    </div>
  );
}
