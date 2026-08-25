/**
 * Authentication Context
 * Provides global auth state and methods
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, RegisterDTO, LoginDTO } from '../services/authService';

/**
 * Auth context type
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginDTO) => Promise<void>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

/**
 * Create context with default values
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  clearAuth: async () => {},
});

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check auth status on mount
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check if user is authenticated
   */
  const checkAuthStatus = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        // Verify token by calling the API
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
        } catch (apiError) {
          // Token is invalid/expired, clear auth
          console.log('Token invalid or expired, clearing auth');
          await authService.logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (data: LoginDTO) => {
    const result = await authService.login(data);
    setUser(result.user);
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterDTO) => {
    const result = await authService.register(data);
    setUser(result.user);
  };

  /**
   * Logout user
   */
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  /**
   * Clear auth data (for invalid/expired tokens)
   */
  const clearAuth = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
