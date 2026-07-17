import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MediaVersion — immutable history of every replaced/edited revision
 * of a Media asset. Powers "Version History", "Compare versions", and
 * "Rollback".
 */
const mediaVersionSchema = new Schema(
  {
    media: { type: Schema.Types.ObjectId, ref: 'Media', required: true, index: true },
    versionNumber: { type: Number, required: true },

    // Snapshot of storage/file state at this version
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    secureUrl: { type: String, required: true },
    bytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    hash: { type: String },

    changeType: {
      type: String,
      enum: ['upload', 'replace', 'edit', 'transform', 'restore'],
      required: true,
    },
    changeSummary: { type: String, maxlength: 500 },

    // Snapshot of editable metadata at this version, for diffing
    metadataSnapshot: { type: Schema.Types.Mixed },

    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

mediaVersionSchema.index({ media: 1, versionNumber: -1 }, { unique: true });

export default mongoose.model('MediaVersion', mediaVersionSchema);
