/**
 * Secure Storage Wrapper
 * 
 * - Web: uses localStorage as fallback
 * - Native (Android/iOS): uses expo-secure-store
 */

import { Platform } from 'react-native';

// Web implementation using localStorage
const webStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage setItem failed:', error);
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage removeItem failed:', error);
    }
  },
};

// Lazy load SecureStore only on native platforms
let nativeStorage: any = null;

async function getNativeStorage() {
  if (nativeStorage) return nativeStorage;
  
  try {
    const SecureStore = await import('expo-secure-store');
    nativeStorage = SecureStore;
    return nativeStorage;
  } catch (error) {
    console.error('Failed to load expo-secure-store:', error);
    return webStorage; // Fallback to web storage
  }
}

/**
 * Get item from storage
 */
export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webStorage.getItemAsync(key);
  }
  
  const storage = await getNativeStorage();
  return storage.getItemAsync(key);
}

/**
 * Set item in storage
 */
export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    return webStorage.setItemAsync(key, value);
  }
  
  const storage = await getNativeStorage();
  return storage.setItemAsync(key, value);
}

/**
 * Delete item from storage
 */
export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    return webStorage.deleteItemAsync(key);
  }
  
  const storage = await getNativeStorage();
  return storage.deleteItemAsync(key);
}

export default {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
};
