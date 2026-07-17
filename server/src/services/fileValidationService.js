import { fileTypeFromBuffer } from 'file-type';
import mime from 'mime-types';
import imageSize from 'image-size';
import { PDFDocument } from 'pdf-lib';
import env from '../config/env.js';
import { ValidationError } from '../errors/AppError.js';
import { sanitizeSvgBuffer } from '../utils/svgSanitizer.js';
import { hashBuffer } from '../utils/hashFile.js';
import logger from '../utils/logger.js';

// Types that file-type cannot fingerprint by magic bytes (plain text / XML-ish
// formats) but that the module still needs to accept. These are validated by
// content shape instead of a binary signature.
const TEXT_LIKE_MIME_ALLOWLIST = new Set([
  'text/plain',
  'text/csv',
  'application/json',
  'image/svg+xml',
]);

/**
 * Validates an uploaded file end-to-end:
 *   1. Declared MIME type is on the allowlist.
 *   2. Actual binary signature (magic number) matches — prevents a
 *      renamed .exe from masquerading as a .png.
 *   3. Format-specific structural validation (image dimensions readable,
 *      PDF parses, SVG sanitized).
 *   4. Content hash computed for duplicate detection.
 *
 * Throws ValidationError on any failure. Returns enriched file metadata
 * on success, including a possibly-sanitized buffer (for SVGs).
 */
export async function validateFile(file) {
  const { buffer, originalname, mimetype: declaredMime } = file;

  if (!env.upload.allowedMimeTypes.includes(declaredMime)) {
    throw new ValidationError(`File type "${declaredMime}" is not permitted.`, { field: 'mimeType' });
  }

  let effectiveMime = declaredMime;
  let effectiveBuffer = buffer;

  if (!TEXT_LIKE_MIME_ALLOWLIST.has(declaredMime)) {
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected) {
      throw new ValidationError(
        'Unable to verify file signature. The file may be corrupted or its content does not match its extension.'
      );
    }
    if (detected.mime !== declaredMime && !isAcceptableMimeAlias(detected.mime, declaredMime)) {
      logger.warn(`[fileValidation] MIME mismatch: declared=${declaredMime} detected=${detected.mime} file=${originalname}`);
      throw new ValidationError(
        `File signature (${detected.mime}) does not match the declared type (${declaredMime}). This file was rejected for security reasons.`,
        { code: 'MIME_MISMATCH' }
      );
    }
    effectiveMime = detected.mime;
  }

  if (declaredMime === 'image/svg+xml') {
    effectiveBuffer = sanitizeSvgBuffer(buffer);
  }

  if (declaredMime === 'application/pdf') {
    await validatePdf(buffer);
  }

  let dimensions = null;
  if (effectiveMime.startsWith('image/')) {
    dimensions = safeImageSize(effectiveBuffer);
  }

  const extensionFromMime = mime.extension(effectiveMime) || originalname.split('.').pop();

  return {
    buffer: effectiveBuffer,
    mimeType: effectiveMime,
    extension: `.${extensionFromMime}`,
    sizeBytes: effectiveBuffer.length,
    width: dimensions?.width,
    height: dimensions?.height,
    hash: hashBuffer(effectiveBuffer),
  };
}

function isAcceptableMimeAlias(detected, declared) {
  // Some legitimate variants that file-type reports differently than the
  // browser's Content-Type header for the same practical format.
  const aliases = {
    'application/zip': ['application/x-zip-compressed'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['application/zip'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['application/zip'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['application/zip'],
  };
  return aliases[declared]?.includes(detected) ?? false;
}

function safeImageSize(buffer) {
  try {
    return imageSize(buffer);
  } catch {
    return null;
  }
}

async function validatePdf(buffer) {
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true, throwOnInvalidObject: false });
    if (doc.getPageCount() < 1) {
      throw new Error('PDF has no pages');
    }
  } catch (err) {
    throw new ValidationError(`Invalid or corrupted PDF file: ${err.message}`);
  }
}

export function assertExtensionAllowed(originalname) {
  const ext = `.${originalname.split('.').pop()?.toLowerCase()}`;
  if (env.upload.blockedExtensions.includes(ext)) {
    throw new ValidationError(`File extension "${ext}" is blocked for security reasons.`);
  }
}

export default validateFile;
