import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { R2_CONFIG } from '../config/r2';
import { AppError } from './errorHandler';

/**
 * Multer Memory Storage Configuration
 * Stores files in memory as buffers for processing before R2 upload
 */
const storage = multer.memoryStorage();

/**
 * File Filter
 * Only allows specific MIME types
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (R2_CONFIG.allowedMimeTypes.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new AppError(
      `File type ${file.mimetype} is not allowed. Allowed: ${R2_CONFIG.allowedMimeTypes.join(', ')}`,
      400
    ));
  }
};

/**
 * Multer upload middleware
 * - memoryStorage: Stores file in memory as Buffer
 * - limits: Max file size 10MB
 * - fileFilter: Only allowed MIME types
 */
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: R2_CONFIG.maxFileSize,
  },
  fileFilter,
});

/**
 * Middleware for single file upload
 * Usage: uploadMiddleware.single('file')
 */
export const uploadSingle = uploadMiddleware.single('file');

/**
 * Middleware for multiple files upload
 * Usage: uploadMiddleware.array('files', 10)
 */
export const uploadMultiple = (maxFiles: number = 10) => 
  uploadMiddleware.array('files', maxFiles);
