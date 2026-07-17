import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MediaPermission — optional fine-grained, per-asset/per-folder ACL
 * overrides layered on top of the host application's role-based
 * permissions. Most deployments will rely solely on role-based checks
 * (see middlewares/permission.js); this collection exists for tenants
 * that need asset-level sharing (e.g. "share this file with these 3 users").
 */
const mediaPermissionSchema = new Schema(
  {
    subjectType: { type: String, enum: ['media', 'folder'], required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true, index: true },

    granteeType: { type: String, enum: ['user', 'role'], required: true },
    granteeId: { type: String, required: true }, // userId or role name, app-agnostic

    permissions: [{ type: String }], // subset of PERMISSIONS keys

    grantedBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

mediaPermissionSchema.index({ subjectType: 1, subjectId: 1, granteeType: 1, granteeId: 1 }, { unique: true });

export default mongoose.model('MediaPermission', mediaPermissionSchema);
