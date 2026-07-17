import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * AuditLog — security/compliance audit trail. Append-only. Every
 * sensitive action (delete, permission change, storage settings change,
 * bulk operation, download of a protected asset) is recorded here with
 * request-level context, independent of the more UX-focused
 * MediaActivity feed.
 */
const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, index: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true }, // media | folder | permission | storage | auth
    resourceId: { type: String },
    statusCode: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

// TTL-style retention is handled by a scheduled job (see jobs/purgeAuditLogs.js)
// rather than a Mongo TTL index, so retention days can be changed via env
// without requiring an index rebuild.

export default mongoose.model('AuditLog', auditLogSchema);
