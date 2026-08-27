import { DocumentModel, IDocument, DocumentCategory, DocumentStatus } from '../models/Document';
import { AppError } from '../middlewares/errorHandler';
import { storageService } from './StorageService';
import mongoose from 'mongoose';

/**
 * DTO for creating a new document
 */
export interface CreateDocumentDTO {
  title: string;
  category: DocumentCategory;
  file: {
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
  };
  expirationDate?: Date; // Optional - not all documents have expiration
  extractedData?: Record<string, any>;
  notifications?: { daysBefore: number }[];
}

/**
 * DTO for updating a document
 */
export interface UpdateDocumentDTO {
  title?: string;
  category?: DocumentCategory;
  expirationDate?: Date;
  extractedData?: Record<string, any>;
  status?: DocumentStatus;
}

/**
 * Query filters for listing documents
 */
export interface DocumentQueryFilters {
  userId: string;
  status?: DocumentStatus;
  category?: DocumentCategory;
  search?: string;
  expiringBefore?: Date;
  page?: number;
  limit?: number;
}

/**
 * Document Service
 * Handles all business logic for document management
 */
export class DocumentService {
  /**
   * Create a new document
   */
  async createDocument(userId: string, data: CreateDocumentDTO): Promise<IDocument> {
    // Validate expiration date is in the future (only if provided)
    if (data.expirationDate && new Date(data.expirationDate) < new Date()) {
      throw new AppError('Expiration date must be in the future', 400);
    }

    // Create document with user association
    const document = await DocumentModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      ...data,
      notifications: data.notifications || [],
      status: 'active',
    });

    return document;
  }

  /**
   * Get all documents for a user with pagination and filters
   */
  async getUserDocuments(filters: DocumentQueryFilters) {
    const {
      userId,
      status,
      category,
      search,
      expiringBefore,
      page = 1,
      limit = 10,
    } = filters;

    // Build query
    const query: mongoose.FilterQuery<IDocument> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (expiringBefore) {
      query.expirationDate = { $lte: expiringBefore };
      query.status = 'active'; // Only active documents can expire
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      DocumentModel.find(query)
        .sort({ expirationDate: 1 }) // Nearest expiration first
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments(query),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single document by ID (with user ownership verification)
   */
  async getDocumentById(documentId: string, userId: string): Promise<IDocument> {
    const document = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return document;
  }

  /**
   * Update a document
   */
  async updateDocument(
    documentId: string,
    userId: string,
    data: UpdateDocumentDTO
  ): Promise<IDocument> {
    const document = await DocumentModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(documentId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return document;
  }

  /**
   * Delete a document permanently (removes from R2 and MongoDB)
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    // First, find the document to get the storageKey
    const document = await DocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Delete file from R2 (if storageKey exists)
    if (document.file?.storageKey) {
      try {
        await storageService.deleteFile(document.file.storageKey);
      } catch (error) {
        console.error('Failed to delete file from R2:', error);
        // Continue with MongoDB deletion even if R2 fails
        // Log the error but don't block the operation
      }
    }

    // Delete document from MongoDB
    await DocumentModel.findByIdAndDelete(document._id);
  }

  /**
   * Get documents expiring soon (for notifications)
   */
  async getExpiringDocuments(userId: string, daysAhead: number = 30): Promise<IDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const documents = await DocumentModel.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active',
      expirationDate: {
        $lte: futureDate,
      },
      'notifications.sent': false,
    });

    return documents;
  }

  /**
   * Mark notification as sent
   */
  async markNotificationSent(
    documentId: string,
    daysBefore: number
  ): Promise<void> {
    await DocumentModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(documentId),
        'notifications.daysBefore': daysBefore,
      },
      {
        $set: {
          'notifications.$.sent': true,
          'notifications.$.sentAt': new Date(),
        },
      }
    );
  }

  /**
   * Get document statistics for a user
   */
  async getUserStats(userId: string) {
    const stats = await DocumentModel.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryStats = await DocumentModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'active',
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Export singleton instance
export const documentService = new DocumentService();
