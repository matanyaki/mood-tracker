
import Constants from 'expo-constants';
import { API_HOST } from '@env';

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
