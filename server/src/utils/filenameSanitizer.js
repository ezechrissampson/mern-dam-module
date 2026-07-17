import path from 'path';
import { nanoid } from 'nanoid';

/**
 * Strips path separators, control characters, and anything not safe for
 * a storage key, then prefixes a random id so uploaded filenames can
 * never collide or be used for path traversal / overwrite attacks.
 */
export function sanitizeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const base = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  const uniqueId = nanoid(10);
  const safeBase = base || 'file';
  return { storedName: `${safeBase}-${uniqueId}${ext}`, publicIdBase: `${safeBase}-${uniqueId}` };
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default sanitizeFilename;
