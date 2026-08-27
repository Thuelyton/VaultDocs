/**
 * Google Gemini AI Provider
 * Uses Google Gemini for document data extraction
 * Model: gemini-1.5-flash (fast and cost-effective)
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { 
  AIProvider, 
  ExtractedDocumentData, 
  DocumentType 
} from './AIProvider';

/**
 * Gemini Configuration
 */
const GEMINI_CONFIG = {
  model: 'gemini-3.6-flash', // Flash mais recente e gratuito
  temperature: 0.1,
  maxOutputTokens: 1000,
};

/**
 * System prompt for document extraction
 */
const EXTRACTION_PROMPT = `You are a document data extraction specialist for Brazilian documents.

Analyze the OCR text provided and extract structured information.

Supported document types:
- RG (Registro Geral - Brazilian ID)
- CNH (Carteira Nacional de Habilitação - Driver's License)
- CPF (Cadastro de Pessoas Físicas - Tax ID)
- CONTRATO (Contract)
- BOLETO (Payment slip)
- GARANTIA (Warranty)
- NOTA_FISCAL (Invoice)
- SEGURO (Insurance)
- PASSAPORTE (Passport)
- TITULO_ELEITOR (Voter Registration)
- CERTIDAO (Certificate)
- OUTROS (Others)

Extract the following information in JSON format:
{
  "documentType": "string",
  "documentNumber": "string or null",
  "person": {
    "name": "string or null",
    "cpf": "string or null",
    "rg": "string or null",
    "birthDate": "string or null",
    "gender": "string or null",
    "nationality": "string or null",
    "motherName": "string or null",
    "fatherName": "string or null"
  },
  "address": {
    "street": "string or null",
    "number": "string or null",
    "complement": "string or null",
    "neighborhood": "string or null",
    "city": "string or null",
    "state": "string or null",
    "zipCode": "string or null"
  },
  "issueDate": "string or null",
  "expirationDate": "string or null",
  "issuer": "string or null",
  "department": "string or null",
  "amount": "number or null",
  "dueDate": "string or null",
  "barcode": "string or null",
  "confidence": "number between 0 and 1"
}

IMPORTANT RULES:
1. Only extract information that is clearly present in the text
2. Do NOT guess or assume information
3. If information is not available, use null
4. Return valid JSON only
5. For dates, use ISO format (YYYY-MM-DD) when possible
6. For CPF, format as XXX.XXX.XXX-XX
7. Calculate confidence based on text quality and completeness`;

/**
 * Google Gemini AI Provider Implementation
 */
export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: GEMINI_CONFIG.model,
        generationConfig: {
          temperature: GEMINI_CONFIG.temperature,
          maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
          responseMimeType: 'application/json',
        },
      });
    }
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.model;
  }

  /**
   * Extract structured data from OCR text
   */
  async extractDocumentData(
    ocrText: string,
    documentHint?: string
  ): Promise<ExtractedDocumentData> {
    if (!this.isConfigured()) {
      // Fallback: Return basic extraction without AI
      return this.fallbackExtraction(ocrText);
    }

    try {
      const userMessage = documentHint 
        ? `${EXTRACTION_PROMPT}\n\nDocument type hint: ${documentHint}\n\nOCR Text:\n${ocrText}`
        : `${EXTRACTION_PROMPT}\n\nOCR Text:\n${ocrText}`;

      const result = await this.model!.generateContent(userMessage);
      const response = await result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error('No response from Gemini');
      }

      const parsed = JSON.parse(content) as ExtractedDocumentData;
      
      // Validate and normalize the response
      return this.validateAndNormalize(parsed, ocrText);

    } catch (error: any) {
      console.error('Gemini extraction error:', error);
      
      // Fallback to basic extraction
      return this.fallbackExtraction(ocrText);
    }
  }

  /**
   * Classify document type from text
   */
  async classifyDocument(
    ocrText: string
  ): Promise<{
    documentType: DocumentType;
    confidence: number;
  }> {
    if (!this.isConfigured()) {
      return this.fallbackClassification(ocrText);
    }

    try {
      const prompt = `Classify the document type from the OCR text below.
Return JSON with documentType and confidence (0-1).
Document types: RG, CNH, CPF, CONTRATO, BOLETO, GARANTIA, NOTA_FISCAL, SEGURO, PASSAPORTE, TITULO_ELEITOR, CERTIDAO, OUTROS

OCR Text:
${ocrText}`;

      const result = await this.model!.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      if (!content) {
        return this.fallbackClassification(ocrText);
      }

      const parsed = JSON.parse(content);
      return {
        documentType: parsed.documentType || 'OUTROS',
        confidence: parsed.confidence || 0.5,
      };

    } catch (error) {
      return this.fallbackClassification(ocrText);
    }
  }

  /**
   * Fallback extraction without AI
   * Uses regex patterns to extract common fields
   */
  private fallbackExtraction(ocrText: string): ExtractedDocumentData {
    const text = ocrText.toUpperCase();
    
    // Detect document type
    let documentType: DocumentType = 'OUTROS';
    let confidence = 0.3;

    if (text.includes('CNH') || text.includes('CARTEIRA NACIONAL')) {
      documentType = 'CNH';
      confidence = 0.6;
    } else if (text.includes('REGISTRO GERAL') || text.includes('RG')) {
      documentType = 'RG';
      confidence = 0.6;
    } else if (text.includes('CPF')) {
      documentType = 'CPF';
      confidence = 0.6;
    } else if (text.includes('BOLETO') || text.includes('VENCIMENTO')) {
      documentType = 'BOLETO';
      confidence = 0.5;
    } else if (text.includes('CONTRATO')) {
      documentType = 'CONTRATO';
      confidence = 0.5;
    }

    // Extract CPF using regex
    const cpfMatch = ocrText.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/);
    const cpf = cpfMatch ? cpfMatch[1] : undefined;

    // Extract dates using regex
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})/g,
      /(\d{2}\.\d{2}\.\d{4})/g,
    ];
    
    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = ocrText.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }

    // Extract numbers that look like document numbers
    const numberMatch = ocrText.match(/\b(\d{6,12})\b/);
    const documentNumber = numberMatch ? numberMatch[1] : undefined;

    return {
      documentType,
      documentNumber,
      person: {
        cpf,
      },
      issueDate: dates[0] || undefined,
      expirationDate: dates[1] || dates[0] || undefined,
      confidence,
      additionalData: {
        rawDates: dates,
        fallbackExtraction: true,
      },
    };
  }

  /**
   * Fallback classification without AI
   */
  private fallbackClassification(ocrText: string): {
    documentType: DocumentType;
    confidence: number;
  } {
    const text = ocrText.toUpperCase();

    const classificationPatterns: Array<{ type: DocumentType; keywords: string[]; confidence: number }> = [
      { type: 'CNH', keywords: ['CNH', 'CARTEIRA NACIONAL DE HABILITACAO'], confidence: 0.7 },
      { type: 'RG', keywords: ['REGISTRO GERAL', 'IDENTIDADE'], confidence: 0.7 },
      { type: 'CPF', keywords: ['CPF', 'CADASTRO DE PESSOAS FISICAS'], confidence: 0.7 },
      { type: 'BOLETO', keywords: ['BOLETO', 'VENCIMENTO', 'PAGAVEL'], confidence: 0.6 },
      { type: 'CONTRATO', keywords: ['CONTRATO', 'CLÁUSULA'], confidence: 0.6 },
      { type: 'NOTA_FISCAL', keywords: ['NOTA FISCAL', 'NF-E'], confidence: 0.6 },
      { type: 'GARANTIA', keywords: ['GARANTIA', 'GARANTE'], confidence: 0.5 },
      { type: 'SEGURO', keywords: ['SEGURO', 'SEGURADORA'], confidence: 0.5 },
    ];

    for (const item of classificationPatterns) {
      for (const keyword of item.keywords) {
        if (text.includes(keyword)) {
          return { documentType: item.type, confidence: item.confidence };
        }
      }
    }

    return { documentType: 'OUTROS', confidence: 0.3 };
  }

  /**
   * Validate and normalize AI response
   */
  private validateAndNormalize(
    data: ExtractedDocumentData,
    originalText: string
  ): ExtractedDocumentData {
    // Ensure required fields
    const normalized: ExtractedDocumentData = {
      documentType: data.documentType || 'OUTROS',
      confidence: Math.min(1, Math.max(0, data.confidence || 0.5)),
    };

    // Copy optional fields if they exist
    if (data.documentNumber) normalized.documentNumber = data.documentNumber;
    if (data.person) normalized.person = data.person;
    if (data.address) normalized.address = data.address;
    if (data.issueDate) normalized.issueDate = data.issueDate;
    if (data.expirationDate) normalized.expirationDate = data.expirationDate;
    if (data.issuer) normalized.issuer = data.issuer;
    if (data.department) normalized.department = data.department;
    if (data.amount) normalized.amount = data.amount;
    if (data.dueDate) normalized.dueDate = data.dueDate;
    if (data.barcode) normalized.barcode = data.barcode;
    if (data.validUntil) normalized.validUntil = data.validUntil;
    if (data.category) normalized.category = data.category;
    if (data.additionalData) normalized.additionalData = data.additionalData;

    // If no expiration date extracted but found in original text
    if (!normalized.expirationDate) {
      const dateMatch = originalText.match(/venc(?:imento|e)?[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i);
      if (dateMatch) {
        normalized.expirationDate = dateMatch[1];
      }
    }

    return normalized;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Google Gemini 1.5 Flash';
  }
}

export default GeminiProvider;
