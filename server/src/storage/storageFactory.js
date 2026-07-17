import env from '../config/env.js';
import CloudinaryProvider from './providers/CloudinaryProvider.js';
import S3Provider from './providers/S3Provider.js';
import LocalProvider from './providers/LocalProvider.js';
import logger from '../utils/logger.js';

/**
 * storageFactory — the single place that knows which concrete
 * StorageProvider implementation is active.
 *
 * Application code should never import a provider class directly;
 * always go through `getStorageProvider()`. This keeps the module
 * provider-agnostic and makes STORAGE_PROVIDER a one-line env swap.
 *
 * To register an additional provider (e.g. Azure Blob, GCS):
 *   registry.myprovider = () => new MyProvider();
 */
const registry = {
  cloudinary: () => new CloudinaryProvider(),
  s3: () => new S3Provider(),
  local: () => new LocalProvider(),
};

let cachedProvider = null;

export function getStorageProvider() {
  if (cachedProvider) return cachedProvider;

  const factory = registry[env.storage.provider];
  if (!factory) {
    throw new Error(
      `[storageFactory] Unknown STORAGE_PROVIDER "${env.storage.provider}". ` +
        `Valid options: ${Object.keys(registry).join(', ')}`
    );
  }

  logger.info(`[storageFactory] Using storage provider: ${env.storage.provider}`);
  cachedProvider = factory();
  return cachedProvider;
}

/** Used by the dashboard's multi-provider status widget. */
export function listRegisteredProviders() {
  return Object.keys(registry);
}

export default getStorageProvider;
