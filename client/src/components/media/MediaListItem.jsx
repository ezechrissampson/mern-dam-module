import { iconFor } from '../../constants/fileIcons.js';
import { formatBytes, formatDate } from '../../utils/format.js';
import useClipboard from '../../hooks/useClipboard.js';

export default function MediaListItem({ media, selected, onToggleSelect, onOpenDetails, onDelete }) {
  const copy = useClipboard();
  const isImage = media.category === 'image';
  const thumb = media.variants?.find((v) => v.label === 'thumbnail')?.url || media.secureUrl;

  return (
    <tr className={selected ? 'table-active' : ''} style={{ cursor: 'pointer' }}>
      <td onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" className="form-check-input" checked={selected} onChange={() => onToggleSelect(media._id)} />
      </td>
      <td onClick={() => onOpenDetails(media)}>
        <div className="d-flex align-items-center gap-2">
          {isImage ? (
            <img src={thumb} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center bg-light rounded"
              style={{ width: 40, height: 40 }}
            >
              <i className={`bi ${iconFor(media)}`} style={{ color: 'var(--dam-primary)' }} />
            </div>
          )}
          <span className="text-truncate" style={{ maxWidth: 260 }}>
            {media.displayName}
          </span>
        </div>
      </td>
      <td className="text-dam-secondary small text-uppercase">{media.extension?.replace('.', '')}</td>
      <td className="text-dam-secondary small">{formatBytes(media.bytes)}</td>
      <td className="text-dam-secondary small">{media.folder?.name || 'Root'}</td>
      <td className="text-dam-secondary small">{formatDate(media.createdAt)}</td>
      <td onClick={(e) => e.stopPropagation()}>
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-outline-secondary" title="Copy URL" onClick={() => copy(media.secureUrl)}>
            <i className="bi bi-link-45deg" />
          </button>
          <button className="btn btn-sm btn-outline-secondary" title="Settings" onClick={() => onOpenDetails(media)}>
            <i className="bi bi-gear" />
          </button>
          <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => onDelete(media)}>
            <i className="bi bi-trash3" />
          </button>
        </div>
      </td>
    </tr>
  );
}
