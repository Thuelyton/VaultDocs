/**
 * Processing Controller
 * Handles document processing requests
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import { DocumentProcessingService } from '../services/DocumentProcessingService';
import { TesseractOCRProvider } from '../services/ocr/TesseractOCRProvider';
import { GeminiProvider } from '../services/ai/GeminiProvider';
import { DocumentModel } from '../models/Document';
import { storageService } from '../services/StorageService';
import { AppError } from '../middlewares/errorHandler';
import mongoose from 'mongoose';

/**
 * Initialize providers
 */
const ocrProvider = new TesseractOCRProvider();
const aiProvider = new GeminiProvider();
const processingService = new DocumentProcessingService(ocrProvider, aiProvider);

/**
 * Processing Controller
 */
export class ProcessingController {
  /**
   * POST /documents/:id/process
   * Process document (OCR + AI extraction)
   */
  async processDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify document exists and belongs to user
    const document = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check if already processing
    if (document.processing?.status === 'PROCESSING') {
      throw new AppError('Document is already being processed', 409);
    }

    // Check retry count
    if (document.processing?.retryCount && document.processing.retryCount >= 3) {
      throw new AppError('Maximum retry attempts reached', 429);
    }

    // Return immediately - processing happens in background
    res.status(202).json({
      status: 'success',
      message: 'Document processing started',
      data: {
        documentId: id,
        status: 'PROCESSING',
      },
    });

    // Process in background
    this.processDocumentInBackground(id, document);
  }

  /**
   * Background processing of document
   */
  private async processDocumentInBackground(
    documentId: string,
    document: any
  ): Promise<void> {
    try {
      // Fetch file from R2
      const fileBuffer = await storageService.getFileBuffer(document.file.storageKey);
      
      // Process document (OCR + AI)
      await processingService.processDocument(
        documentId,
        document.userId.toString(),
        fileBuffer,
        document.file.mimeType
      );
    } catch (error: any) {
      console.error('Background processing error:', error);
      // Update status to failed
      await DocumentModel.findByIdAndUpdate(documentId, {
        $set: {
          'processing.status': 'FAILED',
          'processing.error': error.message || 'Processing failed',
          'processing.failedAt': new Date(),
        },
      });
    }
  }

  /**
   * GET /documents/:id/processing
   * Get processing status
   */
  async getProcessingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    const status = await processingService.getProcessingStatus(id, userId);

    res.status(200).json({
      status: 'success',
      data: status,
    });
  }

  /**
   * PATCH /documents/:id/extracted-data
   * Update extracted data manually
   */
  async updateExtractedData(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;
    const extractedData = req.body;

    await processingService.updateExtractedData(id, userId, extractedData);

    res.status(200).json({
      status: 'success',
      message: 'Extracted data updated',
    });
  }

  /**
   * POST /documents/:id/confirm
   * Confirm extracted data
   */
  async confirmExtractedData(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    await processingService.confirmExtractedData(id, userId);

    res.status(200).json({
      status: 'success',
      message: 'Document confirmed',
    });
  }

  /**
   * POST /documents/:id/reprocess
   * Reprocess document
   */
  async reprocessDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify document exists and belongs to user
    const document = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Reset processing status
    await DocumentModel.findByIdAndUpdate(id, {
      $set: {
        'processing.status': 'PENDING',
        'processing.retryCount': (document.processing?.retryCount || 0) + 1,
        'processing.error': undefined,
        'processing.startedAt': undefined,
        'processing.processedAt': undefined,
        'processing.failedAt': undefined,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Document queued for reprocessing',
    });
  }
}

export const processingController = new ProcessingController();
