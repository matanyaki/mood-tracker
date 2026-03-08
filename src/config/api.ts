
import Constants from 'expo-constants';

/**
 * API Base URL Configuration
 */

// Helper to get the local IP address
const getHost = () => {
    // If we have a specific host URI (from Expo Go)
    /* 
       PROBLEM: When using `expo start --tunnel`, the hostUri returns a proxied domain (e.g. *.exp.direct)
       which does NOT forward port 3000. This causes fetch requests to timeout.
       
       FIX: We must use the computer's local LAN IP address directly.
       Your computer's IP is: 10.0.0.12
    */

    // Use your machine's local IP address
    return 'http://10.0.0.12:3000';
};

export const API_BASE_URL = getHost();

console.log('[API Config] Base URL:', API_BASE_URL);
