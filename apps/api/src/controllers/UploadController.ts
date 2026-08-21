import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import { storageService, MulterFile } from '../services/StorageService';
import { documentService } from '../services/DocumentService';
import { AppError } from '../middlewares/errorHandler';
import { DocumentCategory } from '../models/Document';

/**
 * Upload Controller
 * Handles file upload requests
 */
export class UploadController {
  /**
   * POST /api/v1/upload
   * Upload a single file
   */
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const file = req.file as MulterFile | undefined;

    // Validate file exists
    if (!file) {
      throw new AppError('No file provided. Use field name: file', 400);
    }

    // Upload to R2
    const uploadResult = await storageService.uploadFile(file);

    res.status(201).json({
      status: 'success',
      data: {
        storageKey: uploadResult.storageKey,
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        publicUrl: uploadResult.publicUrl,
      },
    });
  }

  /**
   * POST /api/v1/upload/document
   * Upload file and create document in one step
   */
  async uploadAndCreateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const file = req.file as MulterFile | undefined;
    const { title, category, expirationDate, extractedData } = req.body;

    // Validate file exists
    if (!file) {
      throw new AppError('No file provided. Use field name: file', 400);
    }

    // Validate required fields
    if (!title || !category || !expirationDate) {
      throw new AppError('Missing required fields: title, category, expirationDate', 400);
    }

    // Upload to R2
    const uploadResult = await storageService.uploadFile(file);

    // Create document
    const document = await documentService.createDocument(userId, {
      title,
      category: category as DocumentCategory,
      expirationDate: new Date(expirationDate),
      extractedData: extractedData ? JSON.parse(extractedData) : {},
      file: {
        storageKey: uploadResult.storageKey,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        originalName: uploadResult.originalName,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        document,
        file: {
          publicUrl: uploadResult.publicUrl,
        },
      },
    });
  }

  /**
   * DELETE /api/v1/upload/:storageKey
   * Delete a file from R2
   */
  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { storageKey } = req.params;

    if (!storageKey) {
      throw new AppError('Storage key is required', 400);
    }

    // Decode the storageKey (it may be URL-encoded)
    const decodedKey = decodeURIComponent(storageKey);

    await storageService.deleteFile(decodedKey);

    res.status(204).send();
  }
}

// Export singleton instance
export const uploadController = new UploadController();
