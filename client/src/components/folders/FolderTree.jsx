import { useState } from 'react';

function FolderNode({ node, activeId, onSelect, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children?.length > 0;

  return (
    <div>
      <div
        className={`d-flex align-items-center gap-1 rounded px-2 py-1 ${activeId === node._id ? 'bg-success bg-opacity-10' : ''}`}
        style={{ paddingLeft: depth * 16 + 8, cursor: 'pointer' }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <i
            className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'} small text-dam-secondary`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          />
        ) : (
          <span style={{ width: 12, display: 'inline-block' }} />
        )}
        <i className="bi bi-folder-fill" style={{ color: node.color || 'var(--dam-primary)' }} />
        <span className="small text-truncate">{node.name}</span>
        {node.stats?.assetCount > 0 && <span className="badge bg-light text-dark ms-auto">{node.stats.assetCount}</span>}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <FolderNode key={child._id} node={child} activeId={activeId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({ tree, activeId, onSelect }) {
  return (
    <div className="dam-surface p-2">
      <div
        className={`d-flex align-items-center gap-2 rounded px-2 py-1 ${activeId === null ? 'bg-success bg-opacity-10' : ''}`}
        style={{ cursor: 'pointer' }}
        onClick={() => onSelect(null)}
      >
        <i className="bi bi-house" />
        <span className="small">All Files (Root)</span>
      </div>
      {tree.map((node) => (
        <FolderNode key={node._id} node={node} activeId={activeId} onSelect={onSelect} />
      ))}
    </div>
  );
}
