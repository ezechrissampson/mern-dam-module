import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MediaFavorite — per-user favorites. Kept separate from the Media
 * document (which only carries an aggregate `isFavorite`/`favoritedBy`
 * convenience flag) so favorites scale independently of asset count
 * and support fast "my favorites" queries.
 */
const mediaFavoriteSchema = new Schema(
  {
    media: { type: Schema.Types.ObjectId, ref: 'Media', required: true, index: true },
    user: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

mediaFavoriteSchema.index({ media: 1, user: 1 }, { unique: true });

export default mongoose.model('MediaFavorite', mediaFavoriteSchema);
