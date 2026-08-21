import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_CONFIG } from '../config/r2';
import { AppError } from '../middlewares/errorHandler';
import crypto from 'crypto';
import path from 'path';

/**
 * Multer File interface (from memoryStorage)
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * Upload Result Interface
 */
export interface UploadResult {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
}

/**
 * Storage Service
 * Handles file uploads to Cloudflare R2
 */
export class StorageService {
  /**
   * Generate a unique storage key for the file
   */
  private generateStorageKey(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(originalName).toLowerCase();
    
    // Format: uploads/YYYY/MM/filename-timestamp-random.ext
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `uploads/${year}/${month}/${timestamp}-${randomString}${extension}`;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: MulterFile): void {
    // Check file size
    if (file.size > R2_CONFIG.maxFileSize) {
      throw new AppError(
        `File size exceeds limit of ${R2_CONFIG.maxFileSize / 1024 / 1024}MB`,
        400
      );
    }

    // Check MIME type
    if (!R2_CONFIG.allowedMimeTypes.includes(file.mimetype as any)) {
      throw new AppError(
        `File type ${file.mimetype} is not allowed. Allowed types: ${R2_CONFIG.allowedMimeTypes.join(', ')}`,
        400
      );
    }
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(file: MulterFile): Promise<UploadResult> {
    // Validate file
    this.validateFile(file);

    // Generate unique storage key
    const storageKey = this.generateStorageKey(file.originalname);

    // Create upload command
    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: storageKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
      Metadata: {
        originalName: file.originalname,
      },
    });

    try {
      // Upload to R2
      await r2Client.send(command);

      // Construct public URL
      const publicUrl = `${R2_CONFIG.publicUrl}/${storageKey}`;

      return {
        storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        publicUrl,
      };
    } catch (error) {
      console.error('R2 Upload Error:', error);
      throw new AppError('Failed to upload file to storage', 500);
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(storageKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: storageKey,
    });

    try {
      await r2Client.send(command);
    } catch (error) {
      console.error('R2 Delete Error:', error);
      throw new AppError('Failed to delete file from storage', 500);
    }
  }

  /**
   * Generate a presigned URL for temporary access (private files)
   */
  async getPresignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: storageKey,
    });

    try {
      const url = await getSignedUrl(r2Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('R2 Presigned URL Error:', error);
      throw new AppError('Failed to generate download URL', 500);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
