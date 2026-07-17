const CATEGORIES = ['image', 'document', 'video', 'audio', 'archive'];
const VISIBILITIES = ['public', 'private', 'protected'];

export default function FiltersPanel({ query, onChange }) {
  const toggleCategory = (cat) => {
    const current = query.category ? (Array.isArray(query.category) ? query.category : [query.category]) : [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    onChange({ category: next.length ? next : undefined });
  };

  return (
    <div className="dam-surface p-3 mb-3">
      <div className="row g-3 align-items-end">
        <div className="col-auto">
          <label className="form-label small text-dam-secondary mb-1">Type</label>
          <div className="d-flex gap-1 flex-wrap">
            {CATEGORIES.map((cat) => {
              const active = query.category?.includes?.(cat) || query.category === cat;
              return (
                <button
                  key={cat}
                  className={`btn btn-sm ${active ? 'btn-dam-primary' : 'btn-outline-secondary'} text-capitalize`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-auto">
          <label className="form-label small text-dam-secondary mb-1">Visibility</label>
          <select className="form-select form-select-sm" value={query.visibility || ''} onChange={(e) => onChange({ visibility: e.target.value || undefined })}>
            <option value="">Any</option>
            {VISIBILITIES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="col-auto">
          <label className="form-label small text-dam-secondary mb-1">Sort</label>
          <select className="form-select form-select-sm" value={query.sort || '-createdAt'} onChange={(e) => onChange({ sort: e.target.value })}>
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="-bytes">Largest first</option>
            <option value="bytes">Smallest first</option>
            <option value="displayName">Name A–Z</option>
            <option value="-displayName">Name Z–A</option>
          </select>
        </div>

        <div className="col-auto form-check ms-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="unusedOnly"
            checked={query.unused === 'true'}
            onChange={(e) => onChange({ unused: e.target.checked ? 'true' : undefined })}
          />
          <label className="form-check-label small" htmlFor="unusedOnly">
            Unused only
          </label>
        </div>

        <div className="col-auto form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="favOnly"
            checked={query.favorite === 'true'}
            onChange={(e) => onChange({ favorite: e.target.checked ? 'true' : undefined })}
          />
          <label className="form-check-label small" htmlFor="favOnly">
            Favorites only
          </label>
        </div>
      </div>
    </div>
  );
}
