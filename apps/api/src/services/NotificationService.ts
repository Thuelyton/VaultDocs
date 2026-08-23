
import { IDocument } from '../models/Document';

/**
 * Expiration Status Types
 */
export type ExpirationStatus = 'active' | 'expiring' | 'expired';

/**
 * Notification Service
 * Handles expiration calculations and status classification
 */
export class NotificationService {
  /**
   * Calculate expiration status based on a date
   * @param expirationDate The date to check
   * @returns ExpirationStatus
   */
  static calculateExpirationStatus(expirationDate: Date | string): ExpirationStatus {
    const expDate = new Date(expirationDate);
    const now = new Date();
    
    // Reset hours to compare only dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
    
    // Difference in days
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays <= 30) {
      return 'expiring';
    } else {
      return 'active';
    }
  }

  /**
   * Get documents that are expired or expiring in the next 30 days
   * @param userId The user ID
   * @param limit Max documents to return
   * @returns Documents with status info
   */
  static getExpiringInfo(document: IDocument) {
    const status = this.calculateExpirationStatus(document.expirationDate);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(document.expirationDate.getFullYear(), document.expirationDate.getMonth(), document.expirationDate.getDate());
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      status,
      daysToExpiration: diffDays,
    };
  }
}
