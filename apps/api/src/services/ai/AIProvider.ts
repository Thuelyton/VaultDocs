/**
 * AI Provider Interface
 * Abstraction layer for AI/LLM services
 * Allows swapping providers without changing business logic
 */

/**
 * Document types that can be recognized
 */
export type DocumentType = 
  | 'RG'
  | 'CNH'
  | 'CPF'
  | 'CONTRATO'
  | 'BOLETO'
  | 'GARANTIA'
  | 'NOTA_FISCAL'
  | 'SEGURO'
  | 'HABILITACAO'
  | 'PASSAPORTE'
  | 'TITULO_ELEITOR'
  | 'CERTIDAO'
  | 'OUTROS';

/**
 * Person information extracted from document
 */
export interface ExtractedPerson {
  name?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  motherName?: string;
  fatherName?: string;
}

/**
 * Address information
 */
export interface ExtractedAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Document extracted data structure
 */
export interface ExtractedDocumentData {
  documentType: DocumentType;
  documentNumber?: string;
  person?: ExtractedPerson;
  address?: ExtractedAddress;
  issueDate?: string;
  expirationDate?: string;
  issuer?: string;
  department?: string;
  amount?: number;
  dueDate?: string;
  barcode?: string;
  validUntil?: string;
  category?: string;
  additionalData?: Record<string, unknown>;
  confidence: number;
}

/**
 * AI Provider Interface
 */
export interface AIProvider {
  /**
   * Extract structured data from OCR text
   */
  extractDocumentData(
    ocrText: string,
    documentHint?: string
  ): Promise<ExtractedDocumentData>;

  /**
   * Classify document type from text
   */
  classifyDocument(
    ocrText: string
  ): Promise<{
    documentType: DocumentType;
    confidence: number;
  }>;

  /**
   * Provider name for logging
   */
  getProviderName(): string;
}

/**
 * Processing status
 */
export type ProcessingStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REVIEW_REQUIRED'
  | 'FAILED';

/**
 * Processing result
 */
export interface ProcessingResult {
  status: ProcessingStatus;
  extractedData?: ExtractedDocumentData;
  ocrText?: string;
  error?: string;
  processingTime?: number;
}
