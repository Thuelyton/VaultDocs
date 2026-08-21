import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import { documentService, CreateDocumentDTO, UpdateDocumentDTO } from '../services/DocumentService';
import { DocumentCategory, DocumentStatus } from '../models/Document';
import { AppError } from '../middlewares/errorHandler';

/**
 * Document Controller
 * Handles HTTP requests for document operations
 */
export class DocumentController {
  /**
   * POST /api/v1/documents
   * Create a new document
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { title, category, file, expirationDate, extractedData, notifications } = req.body;

    // Validate required fields
    if (!title || !category || !file || !expirationDate) {
      throw new AppError('Missing required fields: title, category, file, expirationDate', 400);
    }

    const dto: CreateDocumentDTO = {
      title,
      category: category as DocumentCategory,
      file,
      expirationDate: new Date(expirationDate),
      extractedData,
      notifications,
    };

    const document = await documentService.createDocument(userId, dto);

    res.status(201).json({
      status: 'success',
      data: document,
    });
  }

  /**
   * GET /api/v1/documents
   * List all user's documents with filters and pagination
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { status, category, search, expiringBefore, page, limit } = req.query;

    const result = await documentService.getUserDocuments({
      userId,
      status: status as DocumentStatus | undefined,
      category: category as DocumentCategory | undefined,
      search: search as string | undefined,
      expiringBefore: expiringBefore ? new Date(expiringBefore as string) : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    res.status(200).json({
      status: 'success',
      ...result,
    });
  }

  /**
   * GET /api/v1/documents/:id
   * Get a single document by ID
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    const document = await documentService.getDocumentById(id, userId);

    res.status(200).json({
      status: 'success',
      data: document,
    });
  }

  /**
   * PUT /api/v1/documents/:id
   * Update a document
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, category, expirationDate, extractedData, status } = req.body;

    const dto: UpdateDocumentDTO = {};

    if (title !== undefined) dto.title = title;
    if (category !== undefined) dto.category = category as DocumentCategory;
    if (expirationDate !== undefined) dto.expirationDate = new Date(expirationDate);
    if (extractedData !== undefined) dto.extractedData = extractedData;
    if (status !== undefined) dto.status = status as DocumentStatus;

    const document = await documentService.updateDocument(id, userId, dto);

    res.status(200).json({
      status: 'success',
      data: document,
    });
  }

  /**
   * DELETE /api/v1/documents/:id
   * Delete (archive) a document
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const { id } = req.params;

    await documentService.deleteDocument(id, userId);

    res.status(204).send();
  }

  /**
   * GET /api/v1/documents/stats
   * Get user's document statistics
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;

    const stats = await documentService.getUserStats(userId);

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  }
}

// Export singleton instance
export const documentController = new DocumentController();
