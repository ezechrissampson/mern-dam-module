import axios from 'axios';

/**
 * Central Axios instance for the DAM module.
 *
 * Integration note: this module does not implement authentication.
 * The host application should supply how the auth token/session is
 * attached — by default this reads a bearer token from localStorage
 * (`dam_auth_token`) if present, and always sends cookies
 * (`withCredentials`) for session-cookie-based host apps. Override
 * `setAuthTokenGetter()` from your app's bootstrap to plug in your own
 * token source (e.g. a context, redux store, or auth SDK).
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
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized(error);
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
