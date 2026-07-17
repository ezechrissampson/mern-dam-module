import { useState } from 'react';
import UploadDropzone from '../components/upload/UploadDropzone.jsx';
import useFolderTree from '../hooks/useFolderTree.js';

export default function UploadManager() {
  const [folderId, setFolderId] = useState('');
  const { tree } = useFolderTree();

  const flatten = (nodes, depth = 0) =>
    nodes.flatMap((n) => [{ ...n, depth }, ...flatten(n.children || [], depth + 1)]);
  const flatFolders = flatten(tree);

  return (
    <div>
      <h3 className="mb-1">Upload Manager</h3>
      <p className="text-dam-secondary">Single or batch uploads with drag-and-drop, progress tracking, and automatic retry.</p>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label small text-dam-secondary">Destination folder</label>
          <select className="form-select" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
            <option value="">Root</option>
            {flatFolders.map((f) => (
              <option key={f._id} value={f._id}>
                {'—'.repeat(f.depth)} {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <UploadDropzone folderId={folderId || null} />
    </div>
  );
}
