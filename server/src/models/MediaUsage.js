import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MediaUsage — tracks every place a Media asset is referenced by the
 * host application (a blog post, a product, an email template, etc).
 * The host app is responsible for calling mediaUsageService.recordUsage()
 * / releaseUsage() when it embeds or removes a reference. This collection
 * is what powers "prevent accidental deletion of files currently in use".
 */
const mediaUsageSchema = new Schema(
  {
    media: { type: Schema.Types.ObjectId, ref: 'Media', required: true, index: true },
    contentType: {
      type: String,
      required: true,
      // e.g. blog | product | page | email | banner | profile | cms | custom
    },
    contentId: { type: String, required: true }, // host app's own document id, kept as string to stay app-agnostic
    contentLabel: { type: String }, // human-readable label for the details panel, e.g. "Blog: 10 Tips for..."
    contentUrl: { type: String },
    fieldName: { type: String }, // which field on the host content references this asset

    linkedBy: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

mediaUsageSchema.index({ media: 1, contentType: 1, contentId: 1, fieldName: 1 }, { unique: true });

export default mongoose.model('MediaUsage', mediaUsageSchema);
