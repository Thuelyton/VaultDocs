/**
 * API Configuration
 * 
 * Environment Variables:
 * - EXPO_PUBLIC_API_URL: Production API URL (set in .env or hosting)
 * 
 * Behavior:
 * - Development (local): Uses localhost based on platform
 * - Production: Uses EXPO_PUBLIC_API_URL or falls back to localhost
 */

import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Check for explicit environment variable first (production)
  const envApiUrl = (globalThis as any).__EXPO_PUBLIC_API_URL 
    || process.env.EXPO_PUBLIC_API_URL;
  
  if (envApiUrl) {
    return `${envApiUrl}/api/v1`;
  }

  // Development: Use platform-specific localhost
  if (__DEV__) {
    // Android emulator uses 10.0.2.2 to access host localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api/v1';
    }
    // iOS simulator and Web
    return 'http://localhost:3000/api/v1';
  }
  
  // Fallback for production if env var not set
  return 'http://localhost:3000/api/v1';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
