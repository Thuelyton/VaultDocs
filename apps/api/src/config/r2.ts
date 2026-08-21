import { S3Client } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 Client Configuration
 * 
 * R2 is S3-compatible, so we use the AWS S3Client with R2-specific endpoints.
 * 
 * Environment Variables Required:
 * - R2_ACCOUNT_ID: Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 API access key
 * - R2_SECRET_ACCESS_KEY: R2 API secret key
 * - R2_BUCKET_NAME: Target bucket name
 * - R2_PUBLIC_URL: Public URL for accessing files
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn('⚠️ R2 credentials not configured. File uploads will fail.');
}

/**
 * S3 Client configured for Cloudflare R2
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * R2 Configuration constants
 */
export const R2_CONFIG = {
  bucketName: process.env.R2_BUCKET_NAME || 'vaultdocs-storage',
  publicUrl: process.env.R2_PUBLIC_URL || '',
  
  // File size limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // Allowed MIME types
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
} as const;
