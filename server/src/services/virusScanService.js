import net from 'net';
import env from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Virus scan integration hook.
 *
 * Disabled by default (VIRUS_SCAN_ENABLED=false) because it requires an
 * external engine (e.g. a ClamAV daemon, or a cloud AV API) that isn't
 * assumed to exist in every deployment. When enabled, every upload is
 * scanned before being persisted; infected files are rejected and logged
 * to the audit trail.
 *
 * To integrate a different engine (e.g. a cloud AV REST API instead of
 * ClamAV's INSTREAM protocol), replace `scanWithClamAV` and keep the same
 * `{ status, engine }` return contract.
 */
export async function scanBuffer(buffer, { filename } = {}) {
  if (!env.security.virusScan.enabled) {
    return { status: 'skipped', engine: null };
  }

  try {
    const infected = await scanWithClamAV(buffer);
    return {
      status: infected ? 'infected' : 'clean',
      engine: env.security.virusScan.provider,
      scannedAt: new Date(),
    };
  } catch (err) {
    logger.error(`[virusScan] scan failed for ${filename}: ${err.message}`);
    // Fail closed in production: treat scan errors as inconclusive but do
    // not silently mark the file "clean". Callers should decide whether to
    // block uploads on scan errors via VIRUS_SCAN_FAIL_CLOSED policy.
    return { status: 'error', engine: env.security.virusScan.provider, scannedAt: new Date() };
  }
}

/** Minimal ClamAV INSTREAM protocol client. */
function scanWithClamAV(buffer) {
  return new Promise((resolve, reject) => {
    const { host, port } = env.security.virusScan;
    const socket = net.createConnection({ host, port });
    let response = '';

    socket.on('connect', () => {
      socket.write('zINSTREAM\0');
      const chunkSize = Buffer.alloc(4);
      chunkSize.writeUInt32BE(buffer.length, 0);
      socket.write(chunkSize);
      socket.write(buffer);
      const terminator = Buffer.alloc(4); // zero-length chunk terminates the stream
      socket.write(terminator);
    });

    socket.on('data', (data) => {
      response += data.toString();
    });

    socket.on('end', () => {
      resolve(/FOUND/i.test(response));
    });

    socket.on('error', reject);
    socket.setTimeout(15000, () => {
      socket.destroy();
      reject(new Error('ClamAV scan timed out'));
    });
  });
}

export default scanBuffer;
