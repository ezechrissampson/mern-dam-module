import { useNavigate } from 'react-router-dom';

export default function Topbar({ onSearch }) {
  const navigate = useNavigate();
  return (
    <div className="d-flex align-items-center justify-content-between border-bottom py-3 px-4 dam-surface" style={{ borderRadius: 0 }}>
      <div className="input-group" style={{ maxWidth: 420 }}>
        <span className="input-group-text bg-white border-end-0">
          <i className="bi bi-search text-dam-secondary" />
        </span>
        <input
          type="search"
          className="form-control border-start-0"
          placeholder="Search filename, tags, alt text, folder..."
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-dam-primary d-flex align-items-center gap-2" onClick={() => navigate('/upload')}>
          <i className="bi bi-cloud-upload" /> Upload
        </button>
      </div>
    </div>
  );
}
