/**
 * StorageProvider — the contract every storage adapter must implement.
 *
 * This is the seam that makes the DAM module storage-agnostic. Application
 * code (services/controllers) NEVER talks to Cloudinary, S3, or the disk
 * directly — it only talks to an instance of this interface, obtained from
 * storageFactory.js. Swapping providers is a one-line env var change.
 *
 * To add a new provider:
 *   1. Create src/storage/providers/MyProvider.js extending this class.
 *   2. Implement every method below.
 *   3. Register it in storageFactory.js.
 *   4. Set STORAGE_PROVIDER=myprovider in .env.
 * No other application code needs to change.
 */
export class StorageProvider {
  /** Unique key, e.g. "cloudinary" | "s3" | "local" */
  get name() {
    throw new Error('StorageProvider.name must be implemented');
  }

  /**
   * Upload a file buffer/stream to the provider.
   * @param {Object} params
   * @param {Buffer} params.buffer
   * @param {string} params.filename - sanitized, randomized filename
   * @param {string} params.folder - logical folder path, e.g. "tenant1/images"
   * @param {string} params.mimeType
   * @param {Object} [params.transformation] - provider-specific transform hints
   * @returns {Promise<{
   *   providerAssetId: string,
   *   url: string,
   *   secureUrl: string,
   *   publicId: string,
   *   folder: string,
   *   bytes: number,
   *   format: string,
   *   width?: number,
   *   height?: number,
   *   resourceType: string,
   *   raw: Object
   * }>}
   */
  async upload(_params) {
    throw new Error('upload() not implemented');
  }

  /** Delete an asset by its provider-specific public id. */
  async delete(_publicId, _resourceType = 'image') {
    throw new Error('delete() not implemented');
  }

  /** Rename / move an asset to a new public id or folder. */
  async rename(_fromPublicId, _toPublicId, _resourceType = 'image') {
    throw new Error('rename() not implemented');
  }

  /** Generate a (possibly time-limited, signed) URL for private/protected assets. */
  async getSignedUrl(_publicId, _options = {}) {
    throw new Error('getSignedUrl() not implemented');
  }

  /** Return a transformed delivery URL (thumbnail, resize, format conversion, etc). */
  getTransformedUrl(_publicId, _transformOptions = {}) {
    throw new Error('getTransformedUrl() not implemented');
  }

  /** Health check used by the dashboard's "Storage Provider Status" widget. */
  async healthCheck() {
    throw new Error('healthCheck() not implemented');
  }
}

export default StorageProvider;
