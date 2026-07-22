import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authApi from '../api/authApi.js';
import { setAuthTokenGetter, setUnauthorizedHandler } from '../api/client.js';

const TOKEN_KEY = 'dam_auth_token';
const AuthContext = createContext(null);

// Matches server/.env's STANDALONE_ADMIN_EMAIL / STANDALONE_ADMIN_PASSWORD
// by default. Only ever used by the standalone entry point to establish a
// session automatically in the background — there is no login form.
const DEFAULT_EMAIL = import.meta.env.VITE_STANDALONE_AUTH_EMAIL || 'admin@example.com';
const DEFAULT_PASSWORD = import.meta.env.VITE_STANDALONE_AUTH_PASSWORD || 'ChangeMe123!';

/**
 * AuthProvider — silent session bootstrap for this module's built-in
 * "standalone" auth (see server/src/standalone-auth). The module still
 * requires a valid JWT on every API call (AUTH_MODE=standalone on the
 * backend), but there is no visible login screen: on mount, this
 * provider transparently logs in as the configured default account (or
 * re-validates a token already in localStorage) so the app opens
 * straight to the Dashboard. This is what makes the module independently
 * runnable/testable with zero manual sign-in step.
 *
 * INTEGRATION NOTE: when this module is embedded in a host application
 * that already has its own authentication (AUTH_MODE=host on the
 * backend), do NOT render <AuthProvider> at all — call
 * `setAuthTokenGetter()` / `setUnauthorizedHandler()` (from
 * api/client.js) once from your host app's own auth context instead,
 * pointing them at your existing session/token, and render <DamRoutes />
 * directly. See README > Authentication Modes.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setAuthError(null);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const silentLogin = useCallback(async () => {
    try {
      const res = await authApi.login(DEFAULT_EMAIL, DEFAULT_PASSWORD);
      persistSession(res.data.token, res.data.user);
      return true;
    } catch (err) {
      // Only reachable if the backend isn't reachable, isn't running in
      // AUTH_MODE=standalone, or the default credentials were changed on
      // the server without updating VITE_STANDALONE_AUTH_*.
      setAuthError(err.message || 'Could not establish a session automatically.');
      return false;
    }
  }, [persistSession]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
      try {
        const res = await authApi.me();
        setToken(existingToken);
        setUser(res.data);
        setLoading(false);
        return;
      } catch {
        clearSession();
      }
    }
    await silentLogin();
    setLoading(false);
  }, [clearSession, silentLogin]);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
    setUnauthorizedHandler(() => {
      // Session expired/invalid mid-use — clear it and quietly
      // re-establish a new one in the background rather than bouncing
      // the user to a login screen that no longer exists.
      clearSession();
      silentLogin();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, authError, isAuthenticated: Boolean(token && user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/**
 * Same as useAuth() but returns null instead of throwing when no
 * AuthProvider is present in the tree. Used by components (like Topbar)
 * that need to work both in standalone mode (AuthProvider present) and
 * when embedded in a host app that skips AuthProvider entirely in favor
 * of its own auth UI.
 */
export function useOptionalAuth() {
  return useContext(AuthContext);
}
