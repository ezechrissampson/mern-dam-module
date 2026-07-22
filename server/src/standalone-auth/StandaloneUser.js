import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * StandaloneUser — a minimal, self-contained user record used ONLY when
 * AUTH_MODE=standalone (see server/src/config/env.js). It exists so this
 * module can run, be demoed, and be unit/integration tested completely
 * on its own, without depending on a host application's user system.
 *
 * When this module is mounted into a host application (AUTH_MODE=host),
 * this model is never used — the host app's own user/auth system is the
 * source of truth, and requests already carry `req.user` by the time
 * they reach the DAM router. See README > Authentication Modes.
 */
const standaloneUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },

    // 'admin' satisfies the default permission resolver's superuser
    // fallback (see middlewares/permission.js) — every standalone user
    // gets full access, since fine-grained RBAC is the host app's
    // responsibility in a real integration, not this testing harness.
    roles: { type: [String], default: ['admin'] },
  },
  { timestamps: true }
);

standaloneUserSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    roles: this.roles,
  };
};

export default mongoose.model('StandaloneUser', standaloneUserSchema);
