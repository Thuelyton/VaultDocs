/**
 * Services barrel export
 */

export { authService } from './authService';
export type { User, AuthResponse, RegisterDTO, LoginDTO } from './authService';

export { documentService } from './documentService';
export type {
  Document,
  DocumentCategory,
  DocumentStatus,
  FileData,
  DocumentFilters,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  DocumentStats,
} from './documentService';

export { uploadService } from './uploadService';
export type { UploadResponse, UploadDocumentResponse } from './uploadService';
