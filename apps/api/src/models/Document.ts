import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

/**
 * Document Categories
 */
export type DocumentCategory = 'cnh' | 'rg' | 'boleto' | 'contrato' | 'garantia' | 'outros';

/**
 * Document Status
 */
export type DocumentStatus = 'active' | 'archived' | 'expired';

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
 * Document Interface
 */
export interface IDocument extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: DocumentCategory;
  file: IFile;
  extractedData: Record<string, any>;
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
      enum: ['cnh', 'rg', 'boleto', 'contrato', 'garantia', 'outros'],
      default: 'outros',
    },
    file: {
      type: FileSchema,
      required: true,
    },
    extractedData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    expirationDate: {
      type: Date,
      required: true,
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
        delete ret.__v;
        return ret;
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

// Text index for search functionality
DocumentSchema.index({ title: 'text', category: 'text' });

/**
 * Document Model
 */
export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
