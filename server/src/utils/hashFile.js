import crypto from 'crypto';

/** SHA-256 content hash — used for duplicate detection across the library. */
export function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export default hashBuffer;
