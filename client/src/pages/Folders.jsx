import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFolderTree from '../hooks/useFolderTree.js';
import FolderTree from '../components/folders/FolderTree.jsx';
import folderApi from '../api/folderApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { formatBytes, timeAgo } from '../utils/format.js';

export default function Folders() {
  const { tree, loading, reload } = useFolderTree();
  const [active, setActive] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const handleCreate = async () => {
    const name = window.prompt('New folder name:');
    if (!name) return;
    try {
      await folderApi.create({ name, parentId: active?._id || null });
      toast.success('Folder created.');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRename = async () => {
    if (!active) return;
    const name = window.prompt('Rename folder to:', active.name);
    if (!name) return;
    await folderApi.rename(active._id, name);
    toast.success('Folder renamed.');
    reload();
  };

  const handleDelete = async () => {
    if (!active) return;
    const ok = await confirm({ title: `Delete "${active.name}"?`, message: 'Folders containing assets require confirmation to cascade-delete.', danger: true });
    if (!ok) return;
    try {
      await folderApi.remove(active._id);
      toast.success('Folder deleted.');
      setActive(null);
      reload();
    } catch (err) {
      if (err.code === 'FOLDER_NOT_EMPTY') {
        const cascade = await confirm({ title: 'Folder not empty', message: err.message, danger: true, confirmLabel: 'Delete everything' });
        if (cascade) {
          await folderApi.remove(active._id, true);
          setActive(null);
          reload();
        }
      } else toast.error(err.message);
    }
  };

  const handleFavorite = async () => {
    if (!active) return;
    await folderApi.toggleFavorite(active._id);
    reload();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Folders</h3>
          <p className="text-dam-secondary mb-0">Organize your assets into a nested folder structure</p>
        </div>
        <button className="btn btn-dam-primary" onClick={handleCreate}>
          <i className="bi bi-folder-plus me-2" /> New Folder
        </button>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">{!loading && <FolderTree tree={tree} activeId={active?._id ?? null} onSelect={setActive} />}</div>

        <div className="col-lg-8">
          <div className="dam-surface p-4">
            {!active && <p className="text-dam-secondary mb-0">Select a folder to view its details and statistics.</p>}
            {active && (
              <>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-0">
                      <i className="bi bi-folder-fill me-2" style={{ color: active.color }} />
                      {active.name}
                    </h5>
                    <div className="text-dam-secondary small">{active.path}</div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={handleFavorite}>
                      <i className={`bi ${active.isFavorite ? 'bi-star-fill text-warning' : 'bi-star'}`} />
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={handleRename}>
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={handleDelete}>
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </div>

                <div className="row text-center mb-3">
                  <div className="col">
                    <div className="fs-4 fw-bold">{active.stats?.assetCount || 0}</div>
                    <div className="text-dam-secondary small">Assets</div>
                  </div>
                  <div className="col">
                    <div className="fs-4 fw-bold">{formatBytes(active.stats?.totalBytes)}</div>
                    <div className="text-dam-secondary small">Storage Used</div>
                  </div>
                  <div className="col">
                    <div className="fs-4 fw-bold">{active.stats?.lastUploadAt ? timeAgo(active.stats.lastUploadAt) : '—'}</div>
                    <div className="text-dam-secondary small">Last Upload</div>
                  </div>
                </div>

                <button className="btn btn-dam-primary w-100" onClick={() => navigate(`/library?folder=${active._id}`)}>
                  View assets in this folder
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
