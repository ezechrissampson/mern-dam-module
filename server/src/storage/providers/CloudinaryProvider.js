import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider } from '../StorageProvider.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * Cloudinary implementation of StorageProvider.
 * Primary/default provider for this module.
 */
export class CloudinaryProvider extends StorageProvider {
  constructor() {
    super();
    cloudinary.config({
      cloud_name: env.storage.cloudinary.cloudName,
      api_key: env.storage.cloudinary.apiKey,
      api_secret: env.storage.cloudinary.apiSecret,
      secure: env.storage.cloudinary.secure,
    });
    this.client = cloudinary;
    this.rootFolder = env.storage.cloudinary.rootFolder;
  }

  get name() {
    return 'cloudinary';
  }

  _resolveResourceType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'video'; // Cloudinary treats audio as "video" resource type
    return 'raw'; // documents, zips, etc.
  }

  async upload({ buffer, filename, folder, mimeType, transformation }) {
    const resourceType = this._resolveResourceType(mimeType);
    const fullFolder = [this.rootFolder, folder].filter(Boolean).join('/');

    return new Promise((resolve, reject) => {
      const uploadStream = this.client.uploader.upload_stream(
        {
          folder: fullFolder,
          public_id: filename,
          resource_type: resourceType,
          overwrite: false,
          unique_filename: false,
          use_filename: true,
          eager: transformation?.eager,
          eager_async: Boolean(transformation?.eager),
        },
        (error, result) => {
          if (error) {
            logger.error(`[cloudinary] upload failed: ${error.message}`);
            return reject(error);
          }
          resolve({
            providerAssetId: result.asset_id,
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            folder: fullFolder,
            bytes: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
            resourceType: result.resource_type,
            raw: result,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  async delete(publicId, resourceType = 'image') {
    const result = await this.client.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  }

  async rename(fromPublicId, toPublicId, resourceType = 'image') {
    return this.client.uploader.rename(fromPublicId, toPublicId, { resource_type: resourceType });
  }

  async getSignedUrl(publicId, options = {}) {
    const { resourceType = 'image', expiresInSeconds = 900, transformation } = options;
    const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return this.client.utils.private_download_url(publicId, options.format, {
      resource_type: resourceType,
      type: 'authenticated',
      expires_at: timestamp,
      transformation,
    });
  }

  getTransformedUrl(publicId, transformOptions = {}) {
    return this.client.url(publicId, {
      secure: true,
      ...transformOptions,
    });
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this.client.api.ping();
      return { provider: this.name, status: 'healthy', latencyMs: Date.now() - start };
    } catch (err) {
      return { provider: this.name, status: 'unhealthy', error: err.message };
    }
  }
}

export default CloudinaryProvider;
