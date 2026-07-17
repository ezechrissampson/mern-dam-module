import getStorageProvider from '../storage/storageFactory.js';
import { validateFile, assertExtensionAllowed } from './fileValidationService.js';
import { scanBuffer } from './virusScanService.js';
import { generateThumbnail, generateResponsiveVariants, readImageMetadata } from './imageProcessingService.js';
import { categoryFromMime } from '../constants/fileTypes.js';
import { sanitizeFilename } from '../utils/filenameSanitizer.js';
import MediaVersion from '../models/MediaVersion.js';
import folderRepository from '../repositories/folderRepository.js';
import mediaRepository from '../repositories/mediaRepository.js';
import { recordActivity, recordAuditLog } from './auditService.js';
import cache from '../config/redis.js';
import { ConflictError, ValidationError } from '../errors/AppError.js';
import logger from '../utils/logger.js';

/**
 * Handles a single file upload end-to-end. This is the primary extension
 * point for adding new server-side processing steps (e.g. a custom
 * classification model, OCR, or a bespoke watermark) — add a step here
 * rather than in the controller.
 */
export async function uploadSingleFile({
  file,
  folderId = null,
  visibility = 'public',
  displayName,
  altText,
  caption,
  description,
  tags = [],
  customMetadata = {},
  user,
  allowDuplicate = false,
}) {
  assertExtensionAllowed(file.originalname);

  const validated = await validateFile(file);

  const scanResult = await scanBuffer(validated.buffer, { filename: file.originalname });
  if (scanResult.status === 'infected') {
    await recordAuditLog({
      actor: user._id,
      action: 'upload.blocked.virus',
      resourceType: 'media',
      metadata: { filename: file.originalname },
    });
    throw new ValidationError('This file was flagged by the virus scanner and cannot be uploaded.', {
      code: 'VIRUS_DETECTED',
    });
  }

  if (!allowDuplicate) {
    const duplicate = await mediaRepository.findDuplicateByHash(validated.hash);
    if (duplicate) {
      throw new ConflictError(
        `An identical file already exists: "${duplicate.displayName}". Set allowDuplicate to upload anyway.`,
        'DUPLICATE_FILE'
      );
    }
  }

  const folder = folderId ? await folderRepository.findById(folderId) : null;
  const folderPath = folder ? folder.path.replace(/^\//, '') : '';

  const { storedName, publicIdBase } = sanitizeFilename(file.originalname);
  const category = categoryFromMime(validated.mimeType);

  const provider = getStorageProvider();

  const uploadResult = await provider.upload({
    buffer: validated.buffer,
    filename: publicIdBase,
    folder: folderPath,
    mimeType: validated.mimeType,
  });

  let variants = [];
  let width = validated.width;
  let height = validated.height;

  if (category === 'image' && validated.mimeType !== 'image/svg+xml') {
    try {
      const imgMeta = await readImageMetadata(validated.buffer);
      width = imgMeta.width;
      height = imgMeta.height;

      const [thumb, responsive] = await Promise.all([
        generateThumbnail(validated.buffer),
        generateResponsiveVariants(validated.buffer, { formats: ['webp'] }),
      ]);

      const thumbUpload = await provider.upload({
        buffer: thumb,
        filename: `${publicIdBase}-thumb`,
        folder: `${folderPath}/derivatives`.replace(/^\//, ''),
        mimeType: 'image/webp',
      });
      variants.push({ label: 'thumbnail', url: thumbUpload.secureUrl, width: 320, height: 320, format: 'webp', bytes: thumb.length });

      for (const v of responsive) {
        // eslint-disable-next-line no-await-in-loop
        const varUpload = await provider.upload({
          buffer: v.buffer,
          filename: `${publicIdBase}-${v.label}`,
          folder: `${folderPath}/derivatives`.replace(/^\//, ''),
          mimeType: `image/${v.format}`,
        });
        variants.push({ label: v.label, url: varUpload.secureUrl, width: v.width, format: v.format, bytes: v.buffer.length });
      }
    } catch (err) {
      logger.warn(`[uploadService] responsive variant generation failed (non-fatal): ${err.message}`);
    }
  }

  const media = await mediaRepository.create({
    filename: storedName,
    originalFilename: file.originalname,
    displayName: displayName || file.originalname,
    extension: validated.extension,
    mimeType: validated.mimeType,
    category,
    storageProvider: provider.name,
    providerAssetId: uploadResult.providerAssetId,
    publicId: uploadResult.publicId,
    url: uploadResult.url,
    secureUrl: uploadResult.secureUrl,
    resourceType: uploadResult.resourceType,
    bytes: validated.sizeBytes,
    width,
    height,
    hash: validated.hash,
    folder: folder ? folder._id : null,
    description,
    altText,
    caption,
    customMetadata,
    variants,
    visibility,
    scan: scanResult,
    createdBy: user._id,
  });

  await MediaVersion.create({
    media: media._id,
    versionNumber: 1,
    publicId: media.publicId,
    url: media.url,
    secureUrl: media.secureUrl,
    bytes: media.bytes,
    width: media.width,
    height: media.height,
    hash: media.hash,
    changeType: 'upload',
    changeSummary: 'Initial upload',
    createdBy: user._id,
  });

  if (folder) {
    await folderRepository.recalculateStats(folder._id);
  }

  await recordActivity({
    media: media._id,
    folder: folder?._id,
    action: 'upload',
    message: `Uploaded "${media.displayName}"`,
    actor: user._id,
  });

  await cache.flushPattern('media:list:*');
  await cache.flushPattern('dashboard:*');

  return media;
}

export async function uploadMultipleFiles({ files, ...rest }) {
  const results = { succeeded: [], failed: [] };

  for (const file of files) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const media = await uploadSingleFile({ file, ...rest });
      results.succeeded.push(media);
    } catch (err) {
      results.failed.push({ filename: file.originalname, error: err.message, code: err.code });
    }
  }

  return results;
}

export default { uploadSingleFile, uploadMultipleFiles };
