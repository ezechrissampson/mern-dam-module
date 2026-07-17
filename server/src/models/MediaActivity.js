import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MediaActivity — human-readable activity feed scoped to media/folder
 * actions (upload, rename, move, delete, restore, tag, etc). Distinct
 * from the system-wide AuditLog, which is security/compliance focused
 * and includes request-level detail (IP, user agent).
 */
const mediaActivitySchema = new Schema(
  {
    media: { type: Schema.Types.ObjectId, ref: 'Media', index: true },
    folder: { type: Schema.Types.ObjectId, ref: 'Folder', index: true },
    action: { type: String, required: true, index: true }, // upload | rename | move | delete | restore | edit | tag | version_restore
    message: { type: String },
    metadata: { type: Schema.Types.Mixed },
    actor: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

mediaActivitySchema.index({ createdAt: -1 });

export default mongoose.model('MediaActivity', mediaActivitySchema);
