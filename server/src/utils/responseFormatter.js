/**
 * Consistent JSON envelope for every DAM API response.
 * Success: { success: true, data, meta? }
 * Error:   { success: false, code, message, details? } (see middlewares/errorHandler.js)
 */
export function sendSuccess(res, { statusCode = 200, data = null, meta = undefined, message = undefined } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}

export default sendSuccess;
