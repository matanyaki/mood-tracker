
import Constants from 'expo-constants';
import axios from 'axios';
import { API_HOST } from '@env';
import { auth } from './firebase';

/**
 * API Base URL Configuration
 */

// Helper to get the local IP address
const getHost = () => {
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
 * Request interceptor — attach a fresh Firebase ID token when a user is signed in.
 * Guests (no currentUser) send the request without an Authorization header.
 * A token-refresh failure must never block the request.
 */
api.interceptors.request.use(async (config) => {
  try {
    const token = await auth.currentUser?.getIdToken(true);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.log('[API] Could not attach auth token, continuing without it:', error);
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
  (err) => {
    let message = err.response?.data?.error ?? 'Network error';
    const status = err.response?.status ?? 0;

    if (err.request && !err.response) {
      // Request was sent but no response came back (network down, timeout, etc.)
      message = 'No connection. Check your network.';
    } else if (status === 401) {
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
