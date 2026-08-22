/**
 * Processing Controller
 * Handles document processing requests
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import { DocumentProcessingService } from '../services/DocumentProcessingService';
import { TesseractOCRProvider } from '../services/ocr/TesseractOCRProvider';
import { OpenAIProvider } from '../services/ai/OpenAIProvider';
import { DocumentModel } from '../models/Document';
import { storageService } from '../services/StorageService';
import { AppError } from '../middlewares/errorHandler';
import mongoose from 'mongoose';

/**
 * Initialize providers
 */
const ocrProvider = new TesseractOCRProvider();
const aiProvider = new OpenAIProvider();
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

    // For now, we'll process without fetching the file from R2
    // In production, you'd fetch the file from R2 using the storageKey
    // and pass it to the processing service
    
    // Start processing asynchronously
    // In production, this should be done via a job queue
    res.status(202).json({
      status: 'success',
      message: 'Document processing started',
      data: {
        documentId: id,
        status: 'PROCESSING',
      },
    });

    // Process in background (simplified - in production use a job queue)
    // For now, we'll just update the status since we can't fetch from R2 without real credentials
    await DocumentModel.findByIdAndUpdate(id, {
      $set: {
        'processing.status': 'PENDING',
        'processing.error': 'R2 credentials not configured. Please configure R2 to enable document processing.',
      },
    });
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
