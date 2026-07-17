import { useEffect, useState } from 'react';
import { formatBytes, formatDateTime } from '../../utils/format.js';
import { iconFor } from '../../constants/fileIcons.js';
import mediaApi from '../../api/mediaApi.js';
import useClipboard from '../../hooks/useClipboard.js';
import { useToast } from '../../context/ToastContext.jsx';

const TABS = ['Details', 'Metadata', 'Usage', 'Versions'];

export default function MediaDetailsDrawer({ media, onClose, onChanged }) {
  const [tab, setTab] = useState('Details');
  const [form, setForm] = useState(media);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState([]);
  const [versions, setVersions] = useState([]);
  const copy = useClipboard();
  const toast = useToast();

  useEffect(() => {
    setForm(media);
    setTab('Details');
  }, [media]);

  useEffect(() => {
    if (!media) return;
    if (tab === 'Usage') {
      mediaApi.getUsage(media._id).then((r) => setUsage(r.data));
    }
    if (tab === 'Versions') {
      mediaApi.listVersions(media._id).then((r) => setVersions(r.data));
    }
  }, [tab, media]);

  if (!media) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await mediaApi.update(media._id, {
        displayName: form.displayName,
        description: form.description,
        altText: form.altText,
        caption: form.caption,
        seoTitle: form.seoTitle,
        copyright: form.copyright,
        license: form.license,
        photographer: form.photographer,
        visibility: form.visibility,
      });
      toast.success('Media details saved.');
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isImage = media.category === 'image';

  return (
    <>
      <div className="dam-backdrop" onClick={onClose} />
      <div className="dam-drawer open">
        <div className="d-flex align-items-center justify-content-between border-bottom p-3">
          <h5 className="mb-0 text-truncate">{media.displayName}</h5>
          <button className="btn-close" onClick={onClose} />
        </div>

        <div className="p-3 text-center border-bottom dam-surface">
          {isImage ? (
            <img src={media.secureUrl} alt={media.altText || ''} style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 8 }} />
          ) : (
            <i className={`bi ${iconFor(media)}`} style={{ fontSize: '4rem', color: 'var(--dam-primary)' }} />
          )}
        </div>

        <ul className="nav nav-tabs px-3 pt-2">
          {TABS.map((t) => (
            <li className="nav-item" key={t}>
              <button className={`nav-link ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t}
              </button>
            </li>
          ))}
        </ul>

        <div className="p-3">
          {tab === 'Details' && (
            <div className="vstack gap-2 small">
              <Row label="Filename" value={media.filename} />
              <Row label="Original Filename" value={media.originalFilename} />
              <Row label="Extension" value={media.extension} />
              <Row label="MIME Type" value={media.mimeType} />
              <Row label="Dimensions" value={media.width ? `${media.width} × ${media.height}px` : '—'} />
              <Row label="File Size" value={formatBytes(media.bytes)} />
              <Row label="Storage Provider" value={media.storageProvider} />
              <Row label="Folder" value={media.folder?.name || 'Root'} />
              <Row label="Upload Date" value={formatDateTime(media.createdAt)} />
              <Row label="Last Modified" value={formatDateTime(media.updatedAt)} />
              <Row label="Usage Count" value={media.usageCount} />
              <Row label="Internal ID" value={media._id} mono />
              <Row label="Hash" value={media.hash} mono />
              <div className="d-flex align-items-center justify-content-between border-top pt-2 mt-2">
                <span className="text-dam-secondary">Public URL</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => copy(media.secureUrl)}>
                  <i className="bi bi-clipboard me-1" /> Copy
                </button>
              </div>
            </div>
          )}

          {tab === 'Metadata' && (
            <div className="vstack gap-3">
              <Field label="Display Name" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} />
              <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
              <Field label="Alt Text" value={form.altText} onChange={(v) => setForm({ ...form, altText: v })} />
              <Field label="Caption" value={form.caption} onChange={(v) => setForm({ ...form, caption: v })} />
              <Field label="SEO Title" value={form.seoTitle} onChange={(v) => setForm({ ...form, seoTitle: v })} />
              <Field label="Copyright" value={form.copyright} onChange={(v) => setForm({ ...form, copyright: v })} />
              <Field label="License" value={form.license} onChange={(v) => setForm({ ...form, license: v })} />
              <Field label="Photographer" value={form.photographer} onChange={(v) => setForm({ ...form, photographer: v })} />
              <div>
                <label className="form-label small text-dam-secondary">Visibility</label>
                <select className="form-select form-select-sm" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="protected">Protected</option>
                </select>
              </div>
              <button className="btn btn-dam-primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'Usage' && (
            <div>
              {usage.length === 0 && <p className="text-dam-secondary small">This asset is not currently referenced anywhere.</p>}
              {usage.map((u) => (
                <div key={u._id} className="d-flex justify-content-between border-bottom py-2 small">
                  <div>
                    <div className="fw-medium text-capitalize">{u.contentType}</div>
                    <div className="text-dam-secondary">{u.contentLabel || u.contentId}</div>
                  </div>
                  {u.contentUrl && (
                    <a href={u.contentUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                      Open
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'Versions' && (
            <div>
              {versions.map((v) => (
                <div key={v._id} className="d-flex justify-content-between align-items-center border-bottom py-2 small">
                  <div>
                    <div className="fw-medium">
                      v{v.versionNumber} — {v.changeType}
                    </div>
                    <div className="text-dam-secondary">
                      {formatDateTime(v.createdAt)} &middot; {formatBytes(v.bytes)}
                    </div>
                  </div>
                  {v.versionNumber !== media.currentVersion && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={async () => {
                        await mediaApi.restoreVersion(media._id, v.versionNumber);
                        toast.success(`Restored version ${v.versionNumber}.`);
                        onChanged?.();
                      }}
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="d-flex justify-content-between">
      <span className="text-dam-secondary">{label}</span>
      <span className={`text-end text-truncate ms-3 ${mono ? 'font-monospace' : ''}`} style={{ maxWidth: '65%' }} title={String(value)}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div>
      <label className="form-label small text-dam-secondary">{label}</label>
      {textarea ? (
        <textarea className="form-control form-control-sm" rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="form-control form-control-sm" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
