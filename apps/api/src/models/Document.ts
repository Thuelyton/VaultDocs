import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

/**
 * Document Categories
 * 
 * Legacy categories (for AI/OCR compatibility):
 * - cnh, rg, boleto, contrato, garantia, outros
 * 
 * New categories (Vault/Document Manager):
 * - contas_fixas, despesas_rotativas, documentos_pessoais,
 *   contratos, comprovantes, garantias, impostos, outros
 */
export type DocumentCategory = 
  // Legacy categories (preserved for AI/OCR)
  | 'cnh' 
  | 'rg' 
  | 'boleto' 
  | 'contrato' 
  | 'garantia' 
  // New Vault categories
  | 'contas_fixas' 
  | 'despesas_rotativas' 
  | 'documentos_pessoais' 
  | 'contratos' 
  | 'comprovantes' 
  | 'garantias' 
  | 'impostos' 
  // Default
  | 'outros';

/**
 * Document Status
 */
export type DocumentStatus = 'active' | 'archived' | 'expired';

/**
 * Processing Status
 */
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REVIEW_REQUIRED' | 'FAILED';

/**
 * Notification Interface
 */
export interface INotification {
  daysBefore: number;
  sent: boolean;
  sentAt?: Date;
}

/**
 * File Interface
 */
export interface IFile {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

/**
 * Processing Interface
 */
export interface IProcessing {
  status: ProcessingStatus;
  startedAt?: Date;
  processedAt?: Date;
  failedAt?: Date;
  processingTime?: number;
  error?: string;
  retryCount?: number;
}

/**
 * Extracted Person Interface
 */
export interface IExtractedPerson {
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
 * Extracted Address Interface
 */
export interface IExtractedAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Extracted Data Interface
 */
export interface IExtractedData {
  documentType?: string;
  documentNumber?: string;
  person?: IExtractedPerson;
  address?: IExtractedAddress;
  issueDate?: string;
  expirationDate?: string;
  issuer?: string;
  department?: string;
  amount?: number;
  dueDate?: string;
  barcode?: string;
  validUntil?: string;
  category?: string;
  ocrText?: string;
  ocrConfidence?: number;
  confidence?: number;
  additionalData?: Record<string, any>;
}

/**
 * Document Data Interface (plain object)
 */
export interface IDocumentData {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  category: DocumentCategory;
  file: IFile;
  extractedData: IExtractedData;
  processing: IProcessing;
  expirationDate: Date;
  notifications: INotification[];
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document Mongoose Interface (with methods)
 */
export interface IDocument extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: DocumentCategory;
  file: IFile;
  extractedData: IExtractedData;
  processing: IProcessing;
  expirationDate: Date;
  notifications: INotification[];
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification Schema
 */
const NotificationSchema = new Schema<INotification>(
  {
    daysBefore: {
      type: Number,
      required: true,
      min: 0,
      max: 365,
    },
    sent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
    },
  },
  { _id: false }
);

/**
 * File Schema
 */
const FileSchema = new Schema<IFile>(
  {
    storageKey: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    originalName: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

/**
 * Processing Schema
 */
const ProcessingSchema = new Schema<IProcessing>(
  {
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'REVIEW_REQUIRED', 'FAILED'],
      default: 'PENDING',
    },
    startedAt: {
      type: Date,
    },
    processedAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    processingTime: {
      type: Number,
    },
    error: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

/**
 * Extracted Person Schema
 */
const ExtractedPersonSchema = new Schema<IExtractedPerson>(
  {
    name: { type: String },
    cpf: { type: String },
    rg: { type: String },
    birthDate: { type: String },
    gender: { type: String },
    nationality: { type: String },
    motherName: { type: String },
    fatherName: { type: String },
  },
  { _id: false }
);

/**
 * Extracted Address Schema
 */
const ExtractedAddressSchema = new Schema<IExtractedAddress>(
  {
    street: { type: String },
    number: { type: String },
    complement: { type: String },
    neighborhood: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
  },
  { _id: false }
);

/**
 * Extracted Data Schema
 */
const ExtractedDataSchema = new Schema<IExtractedData>(
  {
    documentType: { type: String },
    documentNumber: { type: String },
    person: { type: ExtractedPersonSchema },
    address: { type: ExtractedAddressSchema },
    issueDate: { type: String },
    expirationDate: { type: String },
    issuer: { type: String },
    department: { type: String },
    amount: { type: Number },
    dueDate: { type: String },
    barcode: { type: String },
    validUntil: { type: String },
    category: { type: String },
    ocrText: { type: String },
    ocrConfidence: { type: Number },
    confidence: { type: Number },
    additionalData: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

/**
 * Document Schema
 */
const DocumentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    category: {
      type: String,
      required: true,
      enum: ['cnh', 'rg', 'boleto', 'contrato', 'garantia', 
             'contas_fixas', 'despesas_rotativas', 'documentos_pessoais',
             'contratos', 'comprovantes', 'garantias', 'impostos', 'outros'],
      default: 'outros',
    },
    file: {
      type: FileSchema,
      required: true,
    },
    extractedData: {
      type: ExtractedDataSchema,
      default: {},
    },
    processing: {
      type: ProcessingSchema,
      default: { status: 'PENDING' },
    },
    expirationDate: {
      type: Date,
      required: false, // Optional - not all documents have expiration
      index: true,
    },
    notifications: {
      type: [NotificationSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'expired'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const { __v: _v, ...rest } = ret;
        return rest;
      },
    },
  }
);

// ===========================================
// Compound Indexes for Performance
// ===========================================

// Index for user's documents filtered by status
DocumentSchema.index({ userId: 1, status: 1 });

// Index for expiration date queries with notification status
DocumentSchema.index({ expirationDate: 1, 'notifications.sent': 1 });

// Index for category filtering per user
DocumentSchema.index({ userId: 1, category: 1 });

// Index for processing status
DocumentSchema.index({ 'processing.status': 1 });

// Text index for search functionality
DocumentSchema.index({ title: 'text', category: 'text' });

/**
 * Document Model
 */
export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
