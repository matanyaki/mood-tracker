// src/config/api.ts
import Constants from 'expo-constants';

/**
 * API Base URL Configuration
 * 
 * For Android Emulator: http://10.0.2.2:3000
 * For iOS Simulator: http://localhost:3000
 * For Physical Device: http://<YOUR_COMPUTER_IP>:3000
 * 
 * Update this based on your development environment.
 */
// export const API_BASE_URL = 'http://10.0.2.2:3000'; // Default for Android Emulator
// export const API_BASE_URL = 'http://localhost:3000'; // Default for iOS Simulator

// Getting the host URI automatically for Expo Go (development)
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0];

export const API_BASE_URL = localhost
    ? `http://${localhost}:3000`
    : 'http://localhost:3000'; // Fallback
