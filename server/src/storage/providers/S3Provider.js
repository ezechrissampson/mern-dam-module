import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider } from '../StorageProvider.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * Amazon S3 implementation of StorageProvider.
 * Demonstrates that the module is not tied to Cloudinary — swap
 * STORAGE_PROVIDER=s3 and configure AWS_* env vars to use this instead.
 */
export class S3Provider extends StorageProvider {
  constructor() {
    super();
    const { region, accessKeyId, secretAccessKey, bucket, publicBaseUrl } = env.storage.s3;
    this.bucket = bucket;
    this.publicBaseUrl = publicBaseUrl || `https://${bucket}.s3.${region}.amazonaws.com`;
    this.client = new S3Client({
      region,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  get name() {
    return 's3';
  }

  _key(folder, filename) {
    return [folder, filename].filter(Boolean).join('/');
  }

  async upload({ buffer, filename, folder, mimeType }) {
    const key = this._key(folder, filename);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      })
    );

    return {
      providerAssetId: key,
      url: `${this.publicBaseUrl}/${key}`,
      secureUrl: `${this.publicBaseUrl}/${key}`,
      publicId: key,
      folder,
      bytes: buffer.length,
      format: (filename.split('.').pop() || '').toLowerCase(),
      resourceType: mimeType.startsWith('image/') ? 'image' : 'raw',
      raw: { key },
    };
  }

  async delete(publicId) {
    return this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: publicId }));
  }

  async rename(fromPublicId, toPublicId) {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${fromPublicId}`,
        Key: toPublicId,
      })
    );
    await this.delete(fromPublicId);
    return { publicId: toPublicId };
  }

  async getSignedUrl(publicId, options = {}) {
    const { expiresInSeconds = env.storage.s3.signedUrlExpirySeconds } = options;
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: publicId });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  getTransformedUrl(publicId) {
    // S3 has no built-in on-the-fly transformation; pair with a Lambda@Edge /
    // CloudFront + Sharp image handler for parity with Cloudinary transforms.
    return `${this.publicBaseUrl}/${publicId}`;
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { provider: this.name, status: 'healthy', latencyMs: Date.now() - start };
    } catch (err) {
      logger.error(`[s3] health check failed: ${err.message}`);
      return { provider: this.name, status: 'unhealthy', error: err.message };
    }
  }
}

export default S3Provider;
