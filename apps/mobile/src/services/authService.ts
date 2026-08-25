/**
 * Authentication Service
 * Handles all auth-related API calls
 */

import apiClient from '../api/client';
import * as SecureStore from '../utils/secureStorage';

// Token storage key
const TOKEN_KEY = '@vaultdocs:token';
const USER_KEY = '@vaultdocs:user';

/**
 * User interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth response interface
 */
export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
}

/**
 * Register DTO
 */
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

/**
 * Login DTO
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Auth Service class
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    const authData = response.data.data;
    
    // Store token and user
    await this.storeAuthData(authData);
    
    return authData;
  }

  /**
   * Login user
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    const authData = response.data.data;
    
    // Store token and user
    await this.storeAuthData(authData);
    
    return authData;
  }

  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  /**
   * Get stored token
   */
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }

  /**
   * Get stored user
   */
  async getStoredUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Store auth data securely
   */
  private async storeAuthData(data: AuthResponse): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
  }
}

// Export singleton instance
export const authService = new AuthService();
