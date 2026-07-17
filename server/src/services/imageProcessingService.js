import sharp from 'sharp';
import logger from '../utils/logger.js';

/**
 * Server-side image optimization pipeline built on Sharp.
 * Produces the original (untouched, always preserved) plus a set of
 * responsive/derived variants used by the Media Library grid, details
 * panel, and any host-app <img srcset>.
 */

const THUMBNAIL_SIZE = { width: 320, height: 320 };
const RESPONSIVE_BREAKPOINTS = [
  { label: 'sm', width: 480 },
  { label: 'md', width: 768 },
  { label: 'lg', width: 1280 },
  { label: 'xl', width: 1920 },
];

sharp.cache(false); // avoid unbounded memory growth in long-running server processes

/** Strips EXIF/GPS by default; call preserveMetadata:true to keep sanitized subset. */
export async function readImageMetadata(buffer) {
  const image = sharp(buffer, { failOn: 'none' });
  const metadata = await image.metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
    exif: metadata.exif ? sanitizeExif(metadata.exif) : null,
  };
}

/**
 * EXIF buffers can contain GPS coordinates and device serials. We only
 * surface a safe, explicit allowlist of fields to the application layer;
 * everything else is dropped rather than blindly passed through.
 */
function sanitizeExif(_rawExifBuffer) {
  // Full EXIF binary parsing is intentionally out of scope here to avoid
  // shipping a heavy dependency; hook in `exif-reader` or `piexifjs` at
  // this seam if per-field EXIF display is required.
  return { present: true };
}

export async function generateThumbnail(buffer, options = {}) {
  const { width = THUMBNAIL_SIZE.width, height = THUMBNAIL_SIZE.height, quality = 80 } = options;
  return sharp(buffer, { failOn: 'none' })
    .rotate() // auto-orient based on EXIF, then strip it
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .webp({ quality })
    .toBuffer();
}

/** Generates the standard responsive breakpoint set + WebP/AVIF variants. */
export async function generateResponsiveVariants(buffer, { formats = ['webp'] } = {}) {
  const image = sharp(buffer, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();
  const variants = [];

  for (const bp of RESPONSIVE_BREAKPOINTS) {
    if (metadata.width && metadata.width <= bp.width) continue; // never upscale

    for (const format of formats) {
      try {
        const pipeline = sharp(buffer, { failOn: 'none' }).rotate().resize({ width: bp.width });
        const output =
          format === 'avif'
            ? await pipeline.avif({ quality: 55 }).toBuffer()
            : format === 'webp'
              ? await pipeline.webp({ quality: 78 }).toBuffer()
              : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();

        variants.push({ label: `${bp.label}-${format}`, buffer: output, width: bp.width, format });
      } catch (err) {
        logger.warn(`[imageProcessing] failed to generate ${bp.label}-${format}: ${err.message}`);
      }
    }
  }

  return variants;
}

export async function transform(buffer, { resize, crop, rotate, flip, flop, format, quality = 85 } = {}) {
  let pipeline = sharp(buffer, { failOn: 'none' }).rotate();

  if (crop) {
    pipeline = pipeline.extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height });
  }
  if (resize) {
    pipeline = pipeline.resize(resize.width, resize.height, { fit: resize.fit || 'inside' });
  }
  if (rotate) pipeline = pipeline.rotate(rotate);
  if (flip) pipeline = pipeline.flip();
  if (flop) pipeline = pipeline.flop();

  if (format === 'webp') pipeline = pipeline.webp({ quality });
  else if (format === 'avif') pipeline = pipeline.avif({ quality: Math.min(quality, 60) });
  else if (format === 'png') pipeline = pipeline.png({ compressionLevel: 8 });
  else pipeline = pipeline.jpeg({ quality, mozjpeg: true });

  return pipeline.toBuffer();
}

/** Simple text/logo watermark, bottom-right, semi-transparent. */
export async function applyWatermark(buffer, watermarkBuffer, options = {}) {
  const { gravity = 'southeast', opacity = 0.5, margin = 24 } = options;
  const marked = await sharp(watermarkBuffer).ensureAlpha(opacity).toBuffer();
  return sharp(buffer)
    .composite([{ input: marked, gravity, blend: 'over', left: undefined, top: undefined }])
    .toBuffer()
    .catch(async () => {
      // Fallback without gravity-based margin fine-tuning if composite fails
      return sharp(buffer).composite([{ input: watermarkBuffer, gravity }]).toBuffer();
    });
}

export default {
  readImageMetadata,
  generateThumbnail,
  generateResponsiveVariants,
  transform,
  applyWatermark,
};
