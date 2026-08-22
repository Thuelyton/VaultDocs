/**
 * OCR Provider Interface
 * Abstraction layer for OCR services
 * Allows swapping providers without changing business logic
 */

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
  words?: Array<{
    text: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface OCRProvider {
  /**
   * Extract text from image
   */
  extractTextFromImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<OCRResult>;

  /**
   * Extract text from PDF
   */
  extractTextFromPDF(
    pdfBuffer: Buffer
  ): Promise<OCRResult>;

  /**
   * Provider name for logging
   */
  getProviderName(): string;
}
