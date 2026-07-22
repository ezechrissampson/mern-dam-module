import axios from 'axios';

/**
 * Central Axios instance for the DAM module.
 *
 * This client itself is auth-agnostic — it just attaches whatever bearer
 * token `tokenGetter` currently points to. In standalone mode (this
 * module's own AuthProvider, see context/AuthContext.jsx), that's a JWT
 * from this module's own /auth/login. When embedded in a host app with
 * its own authentication (AUTH_MODE=host on the backend), call
 * `setAuthTokenGetter()` once from your app's bootstrap to point this
 * at your own token/session source instead. `withCredentials` is also
 * enabled by default for host apps that rely on session cookies rather
 * than bearer tokens.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  timeout: 30000,
});

let tokenGetter = () => localStorage.getItem('dam_auth_token');

export function setAuthTokenGetter(fn) {
  tokenGetter = fn;
}

apiClient.interceptors.request.use((config) => {
  const token = tokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      onUnauthorized(error);
    }
    // requests made with responseType: 'blob' (e.g. the xlsx metadata
    // export) still get JSON error bodies from the server, but axios
    // hands them back as an opaque Blob — decode it so error messages
    // stay readable instead of falling back to "Something went wrong."
    if (error.response?.data instanceof Blob && error.response.data.type?.includes('json')) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text);
      } catch {
        // leave error.response.data as-is if it isn't parseable JSON
      }
    }
    return Promise.reject(normalizeApiError(error));
  }
);

function normalizeApiError(error) {
  const payload = error.response?.data;
  return {
    message: payload?.message || error.message || 'Something went wrong.',
    code: payload?.code || 'UNKNOWN_ERROR',
    details: payload?.details,
    statusCode: error.response?.status,
    raw: error,
  };
}

export default apiClient;
