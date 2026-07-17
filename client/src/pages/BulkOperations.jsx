import { useState } from 'react';
import useMedia from '../hooks/useMedia.js';
import MediaCard from '../components/media/MediaCard.jsx';
import BulkActionsBar from '../components/media/BulkActionsBar.jsx';
import SkeletonGrid from '../components/common/SkeletonGrid.jsx';
import mediaApi from '../api/mediaApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

/**
 * Dedicated Bulk Operations workspace — the same underlying bulk
 * endpoints as the Media Library's selection bar, surfaced as a
 * standalone workflow for admins doing large batch cleanups.
 */
export default function BulkOperations() {
  const { items, loading, meta, updateQuery, refresh } = useMedia({ limit: 60 });
  const [selected, setSelected] = useState(new Set());
  const toast = useToast();
  const confirm = useConfirm();

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map((i) => i._id)));
  const ids = Array.from(selected);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Bulk Operations</h3>
          <p className="text-dam-secondary mb-0">Select multiple assets to move, tag, archive, export, or delete in one action.</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={selectAll}>
          Select all on page
        </button>
      </div>

      <BulkActionsBar
        count={ids.length}
        onClear={() => setSelected(new Set())}
        onDelete={async () => {
          const ok = await confirm({ title: `Delete ${ids.length} assets?`, danger: true, message: 'They will be moved to the Recycle Bin.' });
          if (!ok) return;
          await mediaApi.bulkDelete(ids);
          toast.success('Deleted.');
          setSelected(new Set());
          refresh();
        }}
        onMove={async () => {
          const folderId = window.prompt('Destination folder ID:');
          if (folderId === null) return;
          await mediaApi.bulkMove(ids, folderId || null);
          toast.success('Moved.');
          refresh();
        }}
        onTag={async () => {
          const raw = window.prompt('Comma-separated tags:');
          if (!raw) return;
          await mediaApi.bulkAssignTags(ids, raw.split(',').map((t) => t.trim()).filter(Boolean));
          toast.success('Tags applied.');
        }}
        onArchive={async () => {
          await mediaApi.bulkArchive(ids, true);
          toast.success('Archived.');
          refresh();
        }}
        onExport={async () => {
          const res = await mediaApi.bulkExportMetadata(ids);
          const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'metadata-export.json';
          a.click();
        }}
      />

      {loading && <SkeletonGrid />}
      {!loading && (
        <div className="dam-media-grid">
          {items.map((media) => (
            <MediaCard key={media._id} media={media} selected={selected.has(media._id)} onToggleSelect={toggleSelect} onOpenDetails={() => {}} onDelete={() => {}} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
