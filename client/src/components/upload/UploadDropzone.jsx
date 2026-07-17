import { useCallback, useRef, useState } from 'react';
import uploadApi from '../../api/uploadApi.js';
import { formatBytes } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * Drag-and-drop upload manager.
 * Each file gets its own queue entry with progress, status, and retry.
 * Uploads run with limited concurrency so a large batch doesn't saturate
 * the browser or the server.
 */
const CONCURRENCY = 3;

export default function UploadDropzone({ folderId = null, onUploaded }) {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState([]); // { id, file, progress, status, error }
  const inputRef = useRef(null);
  const toast = useToast();

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      progress: 0,
      status: 'queued', // queued | uploading | done | error | paused
    }));
    setQueue((prev) => [...prev, ...files]);
    processQueue(files);
  }, []);

  const updateItem = (id, patch) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const uploadOne = async (item) => {
    updateItem(item.id, { status: 'uploading', error: null });
    try {
      const res = await uploadApi.single(item.file, { folderId }, (evt) => {
        const progress = Math.round((evt.loaded / evt.total) * 100);
        updateItem(item.id, { progress });
      });
      updateItem(item.id, { status: 'done', progress: 100 });
      onUploaded?.(res.data);
    } catch (err) {
      updateItem(item.id, { status: 'error', error: err.message });
      toast.error(`${item.file.name}: ${err.message}`);
    }
  };

  const processQueue = async (items) => {
    let index = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (index < items.length) {
        const item = items[index++];
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(item);
      }
    });
    await Promise.all(workers);
  };

  const retry = (item) => uploadOne(item);
  const remove = (id) => setQueue((prev) => prev.filter((i) => i.id !== id));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`dam-dropzone ${dragActive ? 'active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
      >
        <i className="bi bi-cloud-arrow-up" style={{ fontSize: '2.5rem' }} />
        <p className="mt-2 mb-1 fw-medium">Drag & drop files here, or click to browse</p>
        <p className="small mb-0">Images, PDFs, Office documents, CSV, JSON, ZIP, SVG (sanitized)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files?.length && addFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <div className="dam-surface mt-3 p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Upload Queue ({queue.length})</h6>
            <button className="btn btn-sm btn-link text-decoration-none" onClick={() => setQueue([])}>
              Clear finished
            </button>
          </div>
          {queue.map((item) => (
            <div key={item.id} className="d-flex align-items-center gap-3 py-2 border-bottom">
              <i className="bi bi-file-earmark fs-5 text-dam-secondary" />
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex justify-content-between small">
                  <span className="text-truncate" style={{ maxWidth: 260 }}>
                    {item.file.name}
                  </span>
                  <span className="text-dam-secondary">{formatBytes(item.file.size)}</span>
                </div>
                <div className="progress mt-1" style={{ height: 6 }}>
                  <div
                    className={`progress-bar ${item.status === 'error' ? 'bg-danger' : 'bg-success'}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                {item.status === 'error' && <div className="text-danger small mt-1">{item.error}</div>}
              </div>
              <div className="d-flex gap-1">
                {item.status === 'error' && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => retry(item)}>
                    <i className="bi bi-arrow-clockwise" />
                  </button>
                )}
                {item.status === 'done' && <i className="bi bi-check-circle-fill text-success" />}
                <button className="btn btn-sm btn-outline-secondary" onClick={() => remove(item.id)}>
                  <i className="bi bi-x" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
