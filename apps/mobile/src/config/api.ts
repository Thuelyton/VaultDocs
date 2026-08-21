/**
 * API Configuration
 * 
 * Update BASE_URL according to your environment:
 * - Development: http://10.0.2.2:3000 (Android emulator)
 * - Development: http://localhost:3000 (iOS simulator)
 * - Production: https://api.vaultdocs.app
 */

import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Para desenvolvimento
  if (__DEV__) {
    // Android emulator usa 10.0.2.2 para acessar localhost do host
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api/v1';
    }
    // iOS simulator
    return 'http://localhost:3000/api/v1';
  }
  
  // Produção
  return 'https://api.vaultdocs.app/api/v1';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
