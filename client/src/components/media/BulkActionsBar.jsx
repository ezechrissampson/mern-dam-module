export default function BulkActionsBar({ count, onClear, onDelete, onMove, onTag, onArchive, onExport }) {
  if (!count) return null;
  return (
    <div className="dam-surface d-flex align-items-center justify-content-between p-2 px-3 mb-3 sticky-top" style={{ top: 8, zIndex: 5 }}>
      <div className="d-flex align-items-center gap-2">
        <span className="badge bg-dark">{count} selected</span>
        <button className="btn btn-sm btn-link text-decoration-none" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={onMove}>
          <i className="bi bi-folder-symlink me-1" /> Move
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={onTag}>
          <i className="bi bi-tags me-1" /> Tag
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={onArchive}>
          <i className="bi bi-archive me-1" /> Archive
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={onExport}>
          <i className="bi bi-download me-1" /> Export Metadata
        </button>
        <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
          <i className="bi bi-trash3 me-1" /> Delete
        </button>
      </div>
    </div>
  );
}
