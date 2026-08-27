/**
 * Tesseract OCR Provider
 * Uses Tesseract.js for OCR processing
 * Free and open source, works offline
 */

import Tesseract from 'tesseract.js';
import sharp from 'sharp';
const pdfParse = require('pdf-parse');
import { OCRProvider, OCRResult } from './OCRProvider';

/**
 * Tesseract OCR Provider Implementation
 */
export class TesseractOCRProvider implements OCRProvider {
  private readonly languages = 'por+eng'; // Portuguese + English

  /**
   * Extract text from image
   */
  async extractTextFromImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<OCRResult> {
    try {
      // Pre-process image for better OCR
      const processedBuffer = await this.preprocessImage(imageBuffer, mimeType);

      // Perform OCR
      const result = await Tesseract.recognize(
        processedBuffer,
        this.languages,
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              // Log progress if needed
            }
          },
        }
      );

      return {
        text: result.data.text,
        confidence: result.data.confidence / 100, // Normalize to 0-1
        language: this.languages,
      };
    } catch (error: any) {
      console.error('OCR Error:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
    try {
      // Step 1: Try pdf-parse for text-based PDFs
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = pdfData.text?.trim();

      if (extractedText && extractedText.length > 10) {
        // Text-based PDF — no OCR needed
        return {
          text: extractedText,
          confidence: 0.95,
          language: this.languages,
        };
      }

      // Step 2: Scanned/image PDF — no text found, try Tesseract
      console.warn('No text found in PDF via pdf-parse, falling back to Tesseract');
      
      const result = await Tesseract.recognize(
        pdfBuffer,
        this.languages,
        {}
      );

      return {
        text: result.data.text,
        confidence: result.data.confidence / 100,
        language: this.languages,
      };
    } catch (error: any) {
      console.error('PDF OCR Error:', error);
      throw new Error(`PDF OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Pre-process image for better OCR accuracy
   */
  private async preprocessImage(
    buffer: Buffer,
    mimeType: string
  ): Promise<Buffer> {
    try {
      // Use sharp to preprocess the image
      let processed = sharp(buffer);

      // Convert to grayscale for better OCR
      processed = processed.grayscale();

      // Increase contrast
      processed = processed.normalize();

      // Resize if too large (max 3000px on longest side)
      const metadata = await sharp(buffer).metadata();
      const maxSize = 3000;
      
      if (metadata.width && metadata.height) {
        if (metadata.width > maxSize || metadata.height > maxSize) {
          processed = processed.resize({
            width: metadata.width > metadata.height ? maxSize : undefined,
            height: metadata.height >= metadata.width ? maxSize : undefined,
            fit: 'inside',
          });
        }
      }

      // Convert to buffer
      return await processed.toBuffer();
    } catch (error) {
      // If preprocessing fails, return original buffer
      console.warn('Image preprocessing failed, using original:', error);
      return buffer;
    }
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Tesseract.js';
  }
}

export default TesseractOCRProvider;
