import fs from 'fs/promises';
import path from 'path';
import { StorageProvider } from '../StorageProvider.js';
import env from '../../config/env.js';

const STORAGE_ROOT = path.resolve(process.cwd(), 'local-storage');

/**
 * Local filesystem provider. Intended for local development and automated
 * tests only — NOT for production use (no CDN, no redundancy, no signed
 * URLs beyond a naive token). Demonstrates the adapter contract with zero
 * external dependencies.
 */
export class LocalProvider extends StorageProvider {
  get name() {
    return 'local';
  }

  async _ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
  }

  async upload({ buffer, filename, folder, mimeType }) {
    const dir = path.join(STORAGE_ROOT, folder || '');
    await this._ensureDir(dir);
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);

    const publicId = path.join(folder || '', filename).replace(/\\/g, '/');
    return {
      providerAssetId: publicId,
      url: `${env.appUrl}/local-assets/${publicId}`,
      secureUrl: `${env.appUrl}/local-assets/${publicId}`,
      publicId,
      folder,
      bytes: buffer.length,
      format: (filename.split('.').pop() || '').toLowerCase(),
      resourceType: mimeType.startsWith('image/') ? 'image' : 'raw',
      raw: { filePath },
    };
  }

  async delete(publicId) {
    const filePath = path.join(STORAGE_ROOT, publicId);
    await fs.rm(filePath, { force: true });
    return { result: 'ok' };
  }

  async rename(fromPublicId, toPublicId) {
    const from = path.join(STORAGE_ROOT, fromPublicId);
    const to = path.join(STORAGE_ROOT, toPublicId);
    await this._ensureDir(path.dirname(to));
    await fs.rename(from, to);
    return { publicId: toPublicId };
  }

  async getSignedUrl(publicId) {
    // Naive dev-only "signed" url — not cryptographically meaningful.
    return `${env.appUrl}/local-assets/${publicId}?t=${Date.now()}`;
  }

  getTransformedUrl(publicId) {
    return `${env.appUrl}/local-assets/${publicId}`;
  }

  async healthCheck() {
    try {
      await this._ensureDir(STORAGE_ROOT);
      return { provider: this.name, status: 'healthy' };
    } catch (err) {
      return { provider: this.name, status: 'unhealthy', error: err.message };
    }
  }
}

export default LocalProvider;
