import mongoose from 'mongoose';

const { Schema } = mongoose;

const folderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    slug: { type: String, required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    path: { type: String, required: true, index: true }, // materialized path e.g. "/marketing/campaigns/2026"
    ancestors: [{ type: Schema.Types.ObjectId, ref: 'Folder' }],

    description: { type: String, maxlength: 1000 },
    color: { type: String, default: '#16A34A' },
    icon: { type: String, default: 'bi-folder' },

    isFavorite: { type: Boolean, default: false },

    // Folder-level permission overrides (optional; host RBAC remains source of truth)
    permissions: {
      viewRoles: [{ type: String }],
      editRoles: [{ type: String }],
      restricted: { type: Boolean, default: false },
    },

    stats: {
      assetCount: { type: Number, default: 0 },
      totalBytes: { type: Number, default: 0 },
      lastUploadAt: { type: Date },
    },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, required: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

folderSchema.index({ parent: 1, name: 1 }, { unique: false });
folderSchema.index({ path: 1 }, { unique: true });

folderSchema.methods.toBreadcrumb = function toBreadcrumb() {
  return this.path.split('/').filter(Boolean);
};

export default mongoose.model('Folder', folderSchema);
