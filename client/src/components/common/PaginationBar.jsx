export default function PaginationBar({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages } = meta;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="d-flex justify-content-between align-items-center mt-4">
      <span className="text-dam-secondary small">
        Page {page} of {totalPages} &middot; {meta.total} total assets
      </span>
      <ul className="pagination mb-0">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)}>
            <i className="bi bi-chevron-left" />
          </button>
        </li>
        {pages.map((p, idx) => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            {idx > 0 && pages[idx - 1] !== p - 1 && <span className="px-2">…</span>}
            <button className="page-link" onClick={() => onPageChange(p)}>
              {p}
            </button>
          </li>
        ))}
        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)}>
            <i className="bi bi-chevron-right" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
