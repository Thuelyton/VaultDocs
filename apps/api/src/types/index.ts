/**
 * Global Type Definitions for VaultDocs API
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  statusCode?: number;
  message?: string;
  data?: T;
  errors?: Record<string, string>[];
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * JWT Token payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * User from JWT (attached to request)
 */
export interface JwtUser {
  userId: string;
  email: string;
}

/**
 * Environment variables type
 */
export interface EnvVars {
  PORT: string;
  MONGO_URI: string;
  JWT_SECRET: string;
  CORS_ORIGIN?: string;
  NODE_ENV?: 'development' | 'production' | 'test';
}

/**
 * File upload metadata
 */
export interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
}

/**
 * Notification type
 */
export interface NotificationConfig {
  daysBefore: number;
  enabled: boolean;
}
