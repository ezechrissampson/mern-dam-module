import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized, validated environment configuration.
 * Fail fast on boot if required variables are missing or malformed —
 * this prevents the classic "works locally, explodes in prod" class of bugs.
 *
 * This build of the module uses Cloudinary as its storage provider.
 * The storage layer is still adapter-based (see storage/StorageProvider.js
 * and storage/storageFactory.js) so another provider can be added later
 * without changing application code — see README > Extension Guide.
 */

const required = ['MONGO_URI'];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const toArray = (value, fallback = []) =>
  (value ? value.split(',').map((v) => v.trim()).filter(Boolean) : fallback);

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 5001),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appUrl: process.env.APP_URL || 'http://localhost:5001',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI,

  redis: {
    url: process.env.REDIS_URL || '',
    ttlSeconds: Number(process.env.REDIS_TTL_SECONDS || 300),
  },

  storage: {
    provider: (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase(),
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      rootFolder: process.env.CLOUDINARY_ROOT_FOLDER || 'dam',
      secure: toBool(process.env.CLOUDINARY_SECURE, true),
    },
  },

  upload: {
    maxSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB || 100),
    maxFilesPerRequest: Number(process.env.MAX_FILES_PER_REQUEST || 20),
    chunkSizeMb: Number(process.env.CHUNK_SIZE_MB || 5),
    allowedMimeTypes: toArray(process.env.ALLOWED_MIME_TYPES),
    blockedExtensions: toArray(process.env.BLOCKED_EXTENSIONS),
  },

  security: {
    rateLimitWindowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300),
    uploadRateLimitMax: Number(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || 60),
    trustProxy: Number(process.env.TRUST_PROXY || 1),
    signedUrlSecret: process.env.SIGNED_URL_SECRET || 'insecure-dev-secret-change-me',
    auditLogRetentionDays: Number(process.env.AUDIT_LOG_RETENTION_DAYS || 180),
    virusScan: {
      enabled: toBool(process.env.VIRUS_SCAN_ENABLED, false),
      provider: process.env.VIRUS_SCAN_PROVIDER || 'clamav',
      host: process.env.VIRUS_SCAN_HOST,
      port: Number(process.env.VIRUS_SCAN_PORT || 3310),
    },
  },

  /**
   * AUTH_MODE controls whether this module manages its own users/login
   * (standalone — the default, used for running the module by itself,
   * demos, and unit/integration testing) or defers entirely to a host
   * application's existing authentication (host — used when this module
   * is mounted into an app that already authenticates requests before
   * they reach the DAM router). See README > Authentication Modes.
   */
  authMode: (process.env.AUTH_MODE || 'standalone').toLowerCase(),
  jwt: {
    secret: process.env.JWT_SECRET || 'insecure-dev-jwt-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  standaloneAdmin: {
    email: process.env.STANDALONE_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.STANDALONE_ADMIN_PASSWORD || 'ChangeMe123!',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

if (env.storage.provider === 'cloudinary') {
  const cloudinaryConfig = env.storage.cloudinary;
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
    // eslint-disable-next-line no-console
    console.warn(
      '[env] Cloudinary credentials are incomplete. Uploads will fail until ' +
        'CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are set.'
    );
  }
}

if (env.authMode === 'standalone') {
  if (env.isProduction && env.jwt.secret === 'insecure-dev-jwt-secret-change-me') {
    // eslint-disable-next-line no-console
    console.error('[env] Refusing to start in production with the default JWT_SECRET. Set a strong, random JWT_SECRET.');
    process.exit(1);
  }
  if (env.isProduction && env.standaloneAdmin.password === 'ChangeMe123!') {
    // eslint-disable-next-line no-console
    console.warn('[env] STANDALONE_ADMIN_PASSWORD is still the default. Change it before exposing this deployment.');
  }
} else if (env.authMode !== 'host') {
  // eslint-disable-next-line no-console
  console.warn(`[env] AUTH_MODE="${env.authMode}" is not recognized (expected "standalone" or "host"). Falling back to "standalone".`);
  env.authMode = 'standalone';
}

export default env;
