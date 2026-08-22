/**
 * Document Service
 * Handles all document-related API calls
 */

import apiClient from '../api/client';

/**
 * Document Category
 */
export type DocumentCategory = 'cnh' | 'rg' | 'boleto' | 'contrato' | 'garantia' | 'outros';

/**
 * Document Status
 */
export type DocumentStatus = 'active' | 'archived' | 'expired';

/**
 * File Interface
 */
export interface FileData {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

/**
 * Document Interface
 */
export interface Document {
  _id: string;
  userId: string;
  title: string;
  category: DocumentCategory;
  file: FileData;
  extractedData: Record<string, any>;
  expirationDate: string;
  notifications: Array<{
    daysBefore: number;
    sent: boolean;
    sentAt?: string;
  }>;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  documents?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Filter params
 */
export interface DocumentFilters extends PaginationParams {
  status?: DocumentStatus;
  category?: DocumentCategory;
  search?: string;
  expiringBefore?: string;
}

/**
 * Create Document DTO
 */
export interface CreateDocumentDTO {
  title: string;
  category: DocumentCategory;
  file: FileData;
  expirationDate: string;
  extractedData?: Record<string, any>;
  notifications?: Array<{ daysBefore: number }>;
}

/**
 * Update Document DTO
 */
export interface UpdateDocumentDTO {
  title?: string;
  category?: DocumentCategory;
  expirationDate?: string;
  extractedData?: Record<string, any>;
  status?: DocumentStatus;
}

/**
 * Stats Interface
 */
export interface DocumentStats {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

/**
 * Processing Status Interface
 */
export interface ProcessingStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REVIEW_REQUIRED' | 'FAILED';
  error?: string;
  processedAt?: string;
  processingTime?: number;
}

/**
 * Document Service class
 */
class DocumentService {
  /**
   * Get all documents with filters and pagination
   */
  async getDocuments(filters?: DocumentFilters): Promise<{
    documents: Document[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.expiringBefore) params.append('expiringBefore', filters.expiringBefore);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = `/documents${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ApiResponse<Document>>(url);
    
    return {
      documents: response.data.documents || [],
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<Document> {
    const response = await apiClient.get<{ status: string; data: Document }>(`/documents/${id}`);
    return response.data.data;
  }

  /**
   * Create a new document
   */
  async createDocument(data: CreateDocumentDTO): Promise<Document> {
    const response = await apiClient.post<{ status: string; data: Document }>('/documents', data);
    return response.data.data;
  }

  /**
   * Update a document
   */
  async updateDocument(id: string, data: UpdateDocumentDTO): Promise<Document> {
    const response = await apiClient.put<{ status: string; data: Document }>(`/documents/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a document (archive)
   */
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  }

  /**
   * Process document (OCR + AI extraction)
   */
  async processDocument(id: string): Promise<{ documentId: string; status: string }> {
    const response = await apiClient.post<{ status: string; data: { documentId: string; status: string } }>(
      `/documents/${id}/process`
    );
    return response.data.data;
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(id: string): Promise<ProcessingStatus> {
    const response = await apiClient.get<{ status: string; data: ProcessingStatus }>(
      `/documents/${id}/processing`
    );
    return response.data.data;
  }

  /**
   * Update extracted data manually
   */
  async updateExtractedData(id: string, data: Record<string, any>): Promise<void> {
    await apiClient.patch(`/documents/${id}/extracted-data`, data);
  }

  /**
   * Confirm extracted data
   */
  async confirmExtractedData(id: string): Promise<void> {
    await apiClient.post(`/documents/${id}/confirm`);
  }

  /**
   * Reprocess document
   */
  async reprocessDocument(id: string): Promise<void> {
    await apiClient.post(`/documents/${id}/reprocess`);
  }

  /**
   * Get document statistics
   */
  async getStats(): Promise<DocumentStats> {
    const response = await apiClient.get<{ status: string; data: DocumentStats }>('/documents/stats');
    return response.data.data;
  }

  /**
   * Get expiring documents
   */
  async getExpiringDocuments(days: number = 30): Promise<Document[]> {
    const response = await apiClient.get<{ status: string; count: number; data: Document[] }>(
      `/documents/expiring?days=${days}`
    );
    return response.data.data || [];
  }
}

// Export singleton instance
export const documentService = new DocumentService();
