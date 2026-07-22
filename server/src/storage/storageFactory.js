import CloudinaryProvider from './providers/CloudinaryProvider.js';
import LocalProvider from './providers/LocalProvider.js';
import logger from '../utils/logger.js';

/**
 * storageFactory — the single place that knows which concrete
 * StorageProvider implementation is active.
 *
 * Application code should never import a provider class directly;
 * always go through `getStorageProvider()`. This is what keeps the
 * module provider-agnostic: this build ships with Cloudinary as the
 * production provider (plus a `local` disk adapter for development/
 * tests), but adding another provider later — S3, Azure Blob, GCS —
 * is a matter of implementing StorageProvider and registering it here;
 * no other application code needs to change. See README > Extension Guide.
 */
const registry = {
  cloudinary: () => new CloudinaryProvider(),
  local: () => new LocalProvider(),
};

const ACTIVE_PROVIDER = (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase();

let cachedProvider = null;

export function getStorageProvider() {
  if (cachedProvider) return cachedProvider;

  const factory = registry[ACTIVE_PROVIDER];
  if (!factory) {
    throw new Error(
      `[storageFactory] Unknown storage provider "${ACTIVE_PROVIDER}". Valid options: ${Object.keys(registry).join(', ')}`
    );
  }

  logger.info(`[storageFactory] Using storage provider: ${ACTIVE_PROVIDER}`);
  cachedProvider = factory();
  return cachedProvider;
}

/** Used by the dashboard's storage-provider status widget. */
export function listRegisteredProviders() {
  return Object.keys(registry);
}

export default getStorageProvider;
