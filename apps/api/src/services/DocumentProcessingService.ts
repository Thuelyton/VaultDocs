/**
 * Document Processing Service
 * Orchestrates OCR and AI extraction
 */

import { OCRProvider, OCRResult } from './ocr/OCRProvider';
import { AIProvider, ExtractedDocumentData, ProcessingResult, ProcessingStatus } from './ai/AIProvider';
import { storageService, MulterFile } from './StorageService';
import { DocumentModel } from '../models/Document';
import { AppError } from '../middlewares/errorHandler';
import mongoose from 'mongoose';

/**
 * Processing configuration
 */
const PROCESSING_CONFIG = {
  minConfidenceForAutoConfirm: 0.85,
  maxProcessingTimeMs: 60000,
  retryAttempts: 2,
};

/**
 * Document Processing Service
 */
export class DocumentProcessingService {
  private ocrProvider: OCRProvider;
  private aiProvider: AIProvider;

  constructor(ocrProvider: OCRProvider, aiProvider: AIProvider) {
    this.ocrProvider = ocrProvider;
    this.aiProvider = aiProvider;
  }

  /**
   * Process a document (OCR + AI extraction)
   */
  async processDocument(
    documentId: string,
    userId: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Update status to processing
      await this.updateProcessingStatus(documentId, 'PROCESSING');

      // Step 1: OCR - Extract text
      let ocrResult: OCRResult;
      
      if (mimeType === 'application/pdf') {
        ocrResult = await this.ocrProvider.extractTextFromPDF(fileBuffer);
      } else {
        ocrResult = await this.ocrProvider.extractTextFromImage(fileBuffer, mimeType);
      }

      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        await this.updateProcessingStatus(documentId, 'FAILED', 'No text could be extracted from the document');
        return {
          status: 'FAILED',
          error: 'No text could be extracted from the document',
          processingTime: Date.now() - startTime,
        };
      }

      // Step 2: AI - Extract structured data
      let extractedData: ExtractedDocumentData;
      
      try {
        extractedData = await this.aiProvider.extractDocumentData(ocrResult.text);
      } catch (aiError: any) {
        console.error('AI extraction error:', aiError);
        await this.updateProcessingStatus(documentId, 'FAILED', 'AI processing failed');
        return {
          status: 'FAILED',
          ocrText: ocrResult.text,
          error: 'Failed to process document with AI',
          processingTime: Date.now() - startTime,
        };
      }

      // Step 3: Determine status based on confidence
      let status: ProcessingStatus;
      
      if (extractedData.confidence >= PROCESSING_CONFIG.minConfidenceForAutoConfirm) {
        status = 'COMPLETED';
      } else {
        status = 'REVIEW_REQUIRED';
      }

      // Step 4: Save extracted data to document
      await DocumentModel.findByIdAndUpdate(
        documentId,
        {
          $set: {
            extractedData: {
              ...extractedData,
              ocrText: ocrResult.text,
              ocrConfidence: ocrResult.confidence,
            },
            'processing.status': status,
            'processing.processedAt': new Date(),
            'processing.processingTime': Date.now() - startTime,
          },
        }
      );

      return {
        status,
        extractedData,
        ocrText: ocrResult.text,
        processingTime: Date.now() - startTime,
      };

    } catch (error: any) {
      console.error('Document processing error:', error);
      
      await this.updateProcessingStatus(
        documentId,
        'FAILED',
        error.message || 'Unknown processing error'
      );

      return {
        status: 'FAILED',
        error: error.message || 'Unknown processing error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Update processing status
   */
  private async updateProcessingStatus(
    documentId: string,
    status: ProcessingStatus,
    error?: string
  ): Promise<void> {
    const update: any = {
      'processing.status': status,
    };

    if (status === 'PROCESSING') {
      update['processing.startedAt'] = new Date();
    }

    if (status === 'COMPLETED' || status === 'REVIEW_REQUIRED') {
      update['processing.processedAt'] = new Date();
    }

    if (status === 'FAILED') {
      update['processing.error'] = error;
      update['processing.failedAt'] = new Date();
    }

    await DocumentModel.findByIdAndUpdate(documentId, { $set: update });
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(documentId: string, userId: string): Promise<{
    status: ProcessingStatus;
    error?: string;
    processedAt?: Date;
    processingTime?: number;
  }> {
    const document = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(userId),
    }).select('processing');

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return {
      status: document.processing?.status || 'PENDING',
      error: document.processing?.error,
      processedAt: document.processing?.processedAt,
      processingTime: document.processing?.processingTime,
    };
  }

  /**
   * Update extracted data manually
   */
  async updateExtractedData(
    documentId: string,
    userId: string,
    extractedData: Partial<ExtractedDocumentData>
  ): Promise<void> {
    const document = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    await DocumentModel.findByIdAndUpdate(documentId, {
      $set: {
        extractedData: {
          ...document.extractedData,
          ...extractedData,
        },
      },
    });
  }

  /**
   * Confirm extracted data
   */
  async confirmExtractedData(
    documentId: string,
    userId: string
  ): Promise<void> {
    const document = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Update status to completed and auto-fill expiration date if available
    const update: any = {
      'processing.status': 'COMPLETED',
    };

    // Auto-fill expiration date from extracted data if not set
    if (document.extractedData?.expirationDate && !document.expirationDate) {
      update.expirationDate = new Date(document.extractedData.expirationDate);
    }

    // Auto-fill title from extracted data if not set
    if (document.extractedData?.documentType && (!document.title || document.title === 'Untitled')) {
      update.title = `${document.extractedData.documentType} - ${document.extractedData.person?.name || 'Document'}`;
    }

    // Auto-fill category from document type
    if (document.extractedData?.documentType) {
      const categoryMap: Record<string, string> = {
        'CNH': 'cnh',
        'RG': 'rg',
        'BOLETO': 'boleto',
        'CONTRATO': 'contrato',
        'GARANTIA': 'garantia',
        'NOTA_FISCAL': 'outros',
        'SEGURO': 'outros',
      };
      const category = categoryMap[document.extractedData.documentType];
      if (category) {
        update.category = category;
      }
    }

    await DocumentModel.findByIdAndUpdate(documentId, { $set: update });
  }
}

export default DocumentProcessingService;
