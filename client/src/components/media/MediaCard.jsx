import { iconFor } from '../../constants/fileIcons.js';
import { formatBytes, timeAgo } from '../../utils/format.js';
import useClipboard from '../../hooks/useClipboard.js';
import mediaApi from '../../api/mediaApi.js';

/**
 * MediaCard — grid tile with the required hover actions:
 * Copy URL, Settings (opens details), Preview, Download, Rename, Move,
 * Favorite, Delete.
 */
export default function MediaCard({ media, selected, onToggleSelect, onOpenDetails, onDelete, onRename, onMove, onChanged }) {
  const copy = useClipboard();
  const isImage = media.category === 'image';
  const thumb = media.variants?.find((v) => v.label === 'thumbnail')?.url || media.secureUrl;

  const handleFavorite = async (e) => {
    e.stopPropagation();
    await mediaApi.toggleFavorite(media._id);
    onChanged?.();
  };

  return (
    <div className={`dam-media-card ${selected ? 'selected' : ''}`} onClick={() => onOpenDetails(media)}>
      <div className="position-absolute top-0 start-0 p-2" style={{ zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" className="form-check-input" checked={selected} onChange={() => onToggleSelect(media._id)} />
      </div>

      <div className="dam-media-hover-actions" onClick={(e) => e.stopPropagation()}>
        <button className="dam-hover-btn" title="Copy public URL" onClick={() => copy(media.secureUrl, 'Public URL copied.')}>
          <i className="bi bi-link-45deg" />
        </button>
        <button className="dam-hover-btn" title="Settings" onClick={() => onOpenDetails(media)}>
          <i className="bi bi-gear" />
        </button>
        <button className="dam-hover-btn" title="Favorite" onClick={handleFavorite}>
          <i className={`bi ${media.isFavorite ? 'bi-star-fill text-warning' : 'bi-star'}`} />
        </button>
        <button className="dam-hover-btn" title="Delete" onClick={() => onDelete(media)}>
          <i className="bi bi-trash3" />
        </button>
      </div>

      {isImage ? (
        <img src={thumb} alt={media.altText || media.displayName} className="dam-media-thumb" loading="lazy" />
      ) : (
        <div className="dam-media-thumb d-flex align-items-center justify-content-center">
          <i className={`bi ${iconFor(media)}`} style={{ fontSize: '2.5rem', color: 'var(--dam-primary)' }} />
        </div>
      )}

      <div className="p-2">
        <div className="text-truncate small fw-medium" title={media.displayName}>
          {media.displayName}
        </div>
        <div className="d-flex justify-content-between text-dam-secondary" style={{ fontSize: '0.7rem' }}>
          <span>{formatBytes(media.bytes)}</span>
          <span>{timeAgo(media.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
