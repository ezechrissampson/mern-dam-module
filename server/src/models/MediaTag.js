import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MediaTag — normalized tag catalog. Kept separate from Media so tags
 * can be renamed/merged globally and so tag autocomplete/search stays fast.
 */
const mediaTagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    color: { type: String, default: '#2563EB' },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('MediaTag', mediaTagSchema);
