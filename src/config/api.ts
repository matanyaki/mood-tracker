
import Constants from 'expo-constants';

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

    // Fallback to the computer's actual current Wi-Fi LAN IP address
    // Your computer's current Wi-Fi IP is: 192.168.1.183
    return 'http://192.168.1.183:3000';
};

export const API_BASE_URL = getHost();

console.log('[API Config] Base URL:', API_BASE_URL);
