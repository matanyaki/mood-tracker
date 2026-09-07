
import Constants from 'expo-constants';
import axios from 'axios';
import { API_HOST, API_URL } from '@env';
import { auth } from './firebase';

/**
 * API Base URL Configuration
 */

// Helper to get the local IP address
const getHost = () => {
    // A full origin wins over everything below. Every other branch here builds
    // `http://<host>:3000`, which cannot describe a deployed backend: that is https,
    // on port 443, at a hostname. Set API_URL to the deployed origin
    // (e.g. https://mood-tracker-api.onrender.com) and the LAN guessing is skipped.
    if (API_URL) {
        console.log('[API Config] Using API_URL:', API_URL);
        return API_URL.replace(/\/+$/, ''); // A trailing slash would double up on every path
    }

    // Attempt to get hostUri dynamically from Expo constants (works when running in LAN mode)
    const hostUri = Constants.expoConfig?.hostUri ||
                    (Constants as any).manifest?.debuggerHost ||
                    (Constants as any).manifest2?.extra?.expoGoLaunchMetadata?.debuggerHost;

    if (hostUri) {
        const parts = hostUri.split(':');
        const ip = parts[0];

        // Ensure it's not a tunnel URL or loopback address
        if (ip && !ip.includes('exp.direct') && !ip.includes('localhost') && !ip.includes('127.0.0.1')) {
            console.log('[API Config] Dynamically detected LAN IP:', ip);
            return `http://${ip}:3000`;
        }
    }

    // With --tunnel, hostUri is an exp.direct address, so detection above is always
    // skipped and we land here. Set API_HOST in the root .env to your machine's
    // current LAN IP (`ipconfig` -> IPv4 Address) — it changes when DHCP renews.
    if (API_HOST) {
        return `http://${API_HOST}:3000`;
    }

    console.warn('[API Config] API_HOST is not set in .env — backend calls will fail.');
    return 'http://localhost:3000';
};

export const API_BASE_URL = getHost();

console.log('[API Config] Base URL:', API_BASE_URL);

/**
 * Error thrown by the axios response interceptor for any failed request.
 * Carries the HTTP status (0 when there was no response) and an optional code.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 0,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Request interceptor — attach the caller's Firebase ID token.
 *
 * Two rules here are load-bearing:
 *
 * 1. Wait for `authStateReady()`. Firebase restores the persisted session from
 *    AsyncStorage asynchronously, so on a cold start `auth.currentUser` is null for
 *    a moment even though the user is signed in. A request that slips through that
 *    window used to go out with no Authorization header.
 *
 * 2. Never send a signed-in user's request unauthenticated. The old code caught
 *    token failures and continued without a header — the backend then answered 401
 *    and the response interceptor relabelled it "Session expired", which blamed the
 *    user's session for what was actually a token-fetch failure on this device.
 *    Failing loudly here keeps the real cause visible.
 */
api.interceptors.request.use(async (config) => {
  // authStateReady exists on the RN auth instance; `auth` is loosely typed.
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }

  const user = auth.currentUser;
  if (!user) {
    // Genuinely signed out (guest mode) — the backend decides whether that's allowed.
    return config;
  }

  try {
    // Deliberately NOT forceRefresh. The SDK already refreshes a token within five
    // minutes of expiry, so forcing it put a securetoken.googleapis.com round-trip
    // in front of every single call and exposed each one to Google's refresh
    // throttling — which bites hardest right after login, when the profile sync,
    // the guest-data migration loop and every screen query fire at once.
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  } catch (error: any) {
    throw new ApiError(
      `Could not get an auth token: ${error?.code ?? error?.message ?? error}`,
      0,
      error?.code
    );
  }

  return config;
});

/**
 * Response interceptor.
 * - Success: unwrap ApiResponse<T> so callers receive `data` directly.
 * - Error: normalize into an ApiError with a user-friendly message.
 */
api.interceptors.response.use(
  (res) => res.data?.data,
  async (err) => {
    // Errors raised by the request interceptor already carry a precise message and
    // never reached the network — don't remap them into a generic transport error.
    if (err instanceof ApiError) {
      return Promise.reject(err);
    }

    const status = err.response?.status ?? 0;
    const config = err.config;

    // A 401 on a request we *did* authenticate means the token was rejected, not
    // missing — a cached token can be stale after a password change or a revoke.
    // Force one refresh and retry once before telling the user to log in again.
    if (status === 401 && config && !config._retriedAfterRefresh && auth.currentUser) {
      config._retriedAfterRefresh = true;
      try {
        await auth.currentUser.getIdToken(true);
        return api.request(config);
      } catch {
        // Refresh failed — fall through to the normal error mapping below.
      }
    }

    let message = err.response?.data?.error ?? 'Network error';

    if (err.request && !err.response) {
      // Request was sent but no response came back (network down, timeout, etc.)
      message = 'No connection. Check your network.';
    } else if (status === 401) {
      // Keep the backend's own wording in the log — "No token provided" and
      // "Invalid token" are very different bugs and the user-facing copy hides that.
      console.warn('[API] 401 from backend:', err.response?.data?.error, err.config?.url);
      message = 'Session expired. Please log in again.';
    } else if (status === 403) {
      message = "You don't have permission to do that.";
    } else if (status === 404) {
      message = 'Not found.';
    } else if (status >= 500) {
      message = 'Server error. Please try again.';
    }

    return Promise.reject(new ApiError(message, status));
  }
);

export { api };
export default api;
