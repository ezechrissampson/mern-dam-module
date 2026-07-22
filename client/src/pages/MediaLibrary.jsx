import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useMedia from '../hooks/useMedia.js';
import useDebounce from '../hooks/useDebounce.js';
import MediaCard from '../components/media/MediaCard.jsx';
import MediaListItem from '../components/media/MediaListItem.jsx';
import MediaDetailsDrawer from '../components/media/MediaDetailsDrawer.jsx';
import FiltersPanel from '../components/media/FiltersPanel.jsx';
import BulkActionsBar from '../components/media/BulkActionsBar.jsx';
import SkeletonGrid from '../components/common/SkeletonGrid.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PaginationBar from '../components/common/PaginationBar.jsx';
import UploadDropzone from '../components/upload/UploadDropzone.jsx';
import mediaApi from '../api/mediaApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

export default function MediaLibrary() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState(new Set());
  const [activeMedia, setActiveMedia] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchInput, 400);

  const { items, meta, loading, query, updateQuery, refresh } = useMedia({ q: searchParams.get('q') || '' });
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    updateQuery({ q: debouncedSearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const handleDelete = async (media) => {
    const ok = await confirm({
      title: 'Move to Recycle Bin?',
      message: `"${media.displayName}" will be moved to the Recycle Bin and can be restored within the retention window.`,
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await mediaApi.remove(media._id);
      toast.success('Moved to Recycle Bin.');
      refresh();
    } catch (err) {
      if (err.code === 'ASSET_IN_USE') {
        const force = await confirm({
          title: 'Asset is in use',
          message: `${err.message} Delete anyway?`,
          danger: true,
          confirmLabel: 'Delete anyway',
        });
        if (force) {
          await mediaApi.remove(media._id, true);
          toast.success('Moved to Recycle Bin.');
          refresh();
        }
      } else {
        toast.error(err.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: `Delete ${selectedIds.length} assets?`,
      message: 'Selected assets will be moved to the Recycle Bin.',
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await mediaApi.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} assets moved to Recycle Bin.`);
      setSelected(new Set());
      refresh();
    } catch (err) {
      if (err.code === 'ASSET_IN_USE') {
        const force = await confirm({ title: 'Some assets are in use', message: err.message, danger: true, confirmLabel: 'Delete anyway' });
        if (force) {
          await mediaApi.bulkDelete(selectedIds, true);
          setSelected(new Set());
          refresh();
        }
      } else toast.error(err.message);
    }
  };

  const handleBulkArchive = async () => {
    await mediaApi.bulkArchive(selectedIds, true);
    toast.success('Selected assets archived.');
    setSelected(new Set());
    refresh();
  };

  const handleBulkExport = async () => {
    const blob = await mediaApi.bulkExportMetadata(selectedIds);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'media-metadata-export.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkTag = async () => {
    const raw = window.prompt('Enter comma-separated tags to apply to selected assets:');
    if (!raw) return;
    const tags = raw.split(',').map((t) => t.trim()).filter(Boolean);
    await mediaApi.bulkAssignTags(selectedIds, tags);
    toast.success('Tags applied.');
    refresh();
  };

  const handleBulkMove = async () => {
    const folderId = window.prompt('Enter destination folder ID (leave blank for Root):');
    if (folderId === null) return;
    await mediaApi.bulkMove(selectedIds, folderId || null);
    toast.success('Assets moved.');
    setSelected(new Set());
    refresh();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Media Library</h3>
          <p className="text-dam-secondary mb-0">Browse, search, and manage every asset in your library</p>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button className={`btn btn-outline-secondary ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
              <i className="bi bi-grid-3x3-gap" />
            </button>
            <button className={`btn btn-outline-secondary ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              <i className="bi bi-list-ul" />
            </button>
          </div>
          <button className="btn btn-dam-primary" onClick={() => setShowUploader((s) => !s)}>
            <i className="bi bi-cloud-upload me-2" /> Upload
          </button>
        </div>
      </div>

      <div className="input-group mb-3">
        <span className="input-group-text">
          <i className="bi bi-search" />
        </span>
        <input
          className="form-control"
          placeholder="Search by filename, description, alt text, caption, tags..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {showUploader && (
        <div className="mb-3">
          <UploadDropzone folderId={query.folder} onUploaded={refresh} />
        </div>
      )}

      <FiltersPanel query={query} onChange={updateQuery} />

      <BulkActionsBar
        count={selectedIds.length}
        onClear={() => setSelected(new Set())}
        onDelete={handleBulkDelete}
        onMove={handleBulkMove}
        onTag={handleBulkTag}
        onArchive={handleBulkArchive}
        onExport={handleBulkExport}
      />

      {loading && <SkeletonGrid />}

      {!loading && items.length === 0 && (
        <EmptyState
          icon="bi-images"
          title="No assets found"
          message="Try adjusting your filters or upload your first file."
          action={
            <button className="btn btn-dam-primary" onClick={() => setShowUploader(true)}>
              Upload files
            </button>
          }
        />
      )}

      {!loading && items.length > 0 && view === 'grid' && (
        <div className="dam-media-grid">
          {items.map((media) => (
            <MediaCard
              key={media._id}
              media={media}
              selected={selected.has(media._id)}
              onToggleSelect={toggleSelect}
              onOpenDetails={setActiveMedia}
              onDelete={handleDelete}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && view === 'list' && (
        <div className="table-responsive dam-surface">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr className="small text-dam-secondary">
                <th></th>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Folder</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((media) => (
                <MediaListItem
                  key={media._id}
                  media={media}
                  selected={selected.has(media._id)}
                  onToggleSelect={toggleSelect}
                  onOpenDetails={setActiveMedia}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationBar meta={meta} onPageChange={(page) => updateQuery({ page })} />

      {activeMedia && (
        <MediaDetailsDrawer
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
          onChanged={() => {
            refresh();
            mediaApi.get(activeMedia._id).then((r) => setActiveMedia(r.data));
          }}
        />
      )}
    </div>
  );
}
