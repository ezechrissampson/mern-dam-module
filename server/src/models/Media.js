import mongoose from 'mongoose';
import { ASSET_CATEGORY, VISIBILITY, ASSET_STATUS } from '../constants/fileTypes.js';

const { Schema } = mongoose;

/**
 * Media — the central digital asset record.
 *
 * Design notes:
 * - Core, frequently-edited metadata (alt text, caption, SEO, custom fields)
 *   is embedded directly for read performance (the Media Library list/grid
 *   view reads this on every page load).
 * - Heavier, append-only concerns — versions, usage, activity, favorites,
 *   granular permissions — live in their own collections (see sibling
 *   model files) so the Media document itself stays lean and indexable.
 * - Soft delete via `status: 'trashed'` powers the Recycle Bin; a scheduled
 *   job permanently purges trashed assets past a retention window.
 */
const responsiveVariantSchema = new Schema(
  {
    label: String, // e.g. "thumbnail", "sm", "md", "lg", "webp", "avif"
    url: String,
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
  },
  { _id: false }
);

const mediaSchema = new Schema(
  {
    // --- Identity ---
    filename: { type: String, required: true }, // sanitized, randomized storage filename
    originalFilename: { type: String, required: true }, // as uploaded by the user
    displayName: { type: String, required: true, trim: true, maxlength: 255 },
    extension: { type: String, required: true, lowercase: true },
    mimeType: { type: String, required: true },
    category: { type: String, enum: Object.values(ASSET_CATEGORY), required: true, index: true },

    // --- Storage ---
    storageProvider: { type: String, required: true, index: true }, // "cloudinary" | "s3" | "local"
    providerAssetId: { type: String, required: true },
    publicId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    secureUrl: { type: String, required: true },
    resourceType: { type: String }, // provider's native resource type

    // --- File properties ---
    bytes: { type: Number, required: true, index: true },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number }, // for future video/audio support
    hash: { type: String, index: true }, // SHA-256 content hash, used for duplicate detection

    // --- Organization ---
    folder: { type: Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'MediaTag', index: true }],
    categories: [{ type: String, trim: true }],

    // --- Editorial metadata ---
    description: { type: String, maxlength: 2000 },
    altText: { type: String, maxlength: 500 },
    caption: { type: String, maxlength: 1000 },
    seoTitle: { type: String, maxlength: 255 },
    copyright: { type: String, maxlength: 255 },
    license: { type: String, maxlength: 255 },
    photographer: { type: String, maxlength: 255 },

    // Sanitized EXIF/GPS — stripped of anything sensitive by default at upload time
    exif: { type: Schema.Types.Mixed, default: {} },
    gps: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // Free-form custom metadata for host-app-specific needs
    customMetadata: { type: Schema.Types.Mixed, default: {} },

    // --- Delivery / responsive images ---
    variants: [responsiveVariantSchema],

    // --- Visibility & lifecycle ---
    visibility: { type: String, enum: Object.values(VISIBILITY), default: VISIBILITY.PUBLIC, index: true },
    status: { type: String, enum: Object.values(ASSET_STATUS), default: ASSET_STATUS.ACTIVE, index: true },

    isFavorite: { type: Boolean, default: false },
    favoritedBy: [{ type: Schema.Types.ObjectId }],

    // --- Versioning pointer (full history lives in MediaVersion collection) ---
    currentVersion: { type: Number, default: 1 },

    // --- Usage / safety ---
    usageCount: { type: Number, default: 0, index: true },

    // --- Security scan hook result ---
    scan: {
      status: { type: String, enum: ['skipped', 'pending', 'clean', 'infected', 'error'], default: 'skipped' },
      scannedAt: { type: Date },
      engine: { type: String },
    },

    // --- Soft delete ---
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId },

    // --- Audit ---
    createdBy: { type: Schema.Types.ObjectId, required: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

mediaSchema.index({ displayName: 'text', description: 'text', altText: 'text', caption: 'text' });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ folder: 1, status: 1, isDeleted: 1 });
mediaSchema.index({ category: 1, status: 1, isDeleted: 1 });

mediaSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

export default mongoose.model('Media', mediaSchema);
