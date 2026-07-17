import multer from 'multer';
import env from '../config/env.js';
import { ValidationError } from '../errors/AppError.js';

/**
 * Files are buffered in memory (not written to local disk) so that
 * a) the process never exposes an uncontrolled filesystem path, and
 * b) the buffer can be handed directly to file-signature validation
 *    and then to whichever StorageProvider is active.
 *
 * For very large files, prefer the chunked upload endpoints
 * (see routes/v1/upload.routes.js) instead of raising this limit.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = `.${file.originalname.split('.').pop()?.toLowerCase()}`;
  if (env.upload.blockedExtensions.includes(ext)) {
    return cb(new ValidationError(`File extension "${ext}" is not allowed.`));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: env.upload.maxSizeMb * 1024 * 1024,
    files: env.upload.maxFilesPerRequest,
  },
  fileFilter,
});

/** Translates multer's thrown errors into the module's standard AppError shape. */
export function multerErrorHandler(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ValidationError(`File exceeds the maximum allowed size of ${env.upload.maxSizeMb}MB.`));
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ValidationError(`Too many files in one request (max ${env.upload.maxFilesPerRequest}).`));
    }
    return next(new ValidationError(err.message));
  }
  return next(err);
}

export default upload;
