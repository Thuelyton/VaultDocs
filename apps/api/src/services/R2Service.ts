import crypto from 'crypto';
import { AppError } from '../middlewares/errorHandler';

/**
 * R2 Service using native fetch (works with Node.js v24)
 * This is an alternative to the AWS SDK which has SSL issues with Node.js v24
 */

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

interface UploadResult {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
}

export class R2Service {
  private config: R2Config;
  private endpoint: string;

  constructor() {
    this.config = {
      accountId: process.env.R2_ACCOUNT_ID || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || 'vaultdocs-storage',
      publicUrl: process.env.R2_PUBLIC_URL || '',
    };

    this.endpoint = `https://${this.config.accountId}.r2.cloudflarestorage.com`;

    console.log('🔍 R2 Config - Account ID:', this.config.accountId ? 'SET' : 'NOT SET');
    console.log('🔍 R2 Config - Access Key:', this.config.accessKeyId ? 'SET' : 'NOT SET');
    console.log('🔍 R2 Config - Secret Key:', this.config.secretAccessKey ? 'SET' : 'NOT SET');

    if (!this.config.accountId || !this.config.accessKeyId || !this.config.secretAccessKey) {
      console.warn('⚠️ R2 credentials not configured. File uploads will fail.');
    } else {
      console.log('✅ R2 Service initialized successfully');
    }
  }

  /**
   * Get signing key for AWS Signature V4
   */
  private getSignatureKey(key: string, dateStamp: string, region: string, service: string): Buffer {
    const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    return kSigning;
  }

  /**
   * Sign a request using AWS Signature V4
   */
  private signRequest(
    method: string,
    path: string,
    querystring: string,
    headers: Record<string, string>,
    payloadHash: string,
    dateStamp: string,
    amzDate: string
  ): string {
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;

    // Create canonical headers (must be sorted alphabetically)
    const sortedHeaders = Object.entries(headers)
      .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    const canonicalHeaders = sortedHeaders
      .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
      .join('\n') + '\n';

    const signedHeaders = sortedHeaders
      .map(([k]) => k.toLowerCase())
      .join(';');

    // Create canonical request
    const canonicalRequest = [
      method,
      path,
      querystring,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    console.log('📝 Canonical Request:');
    console.log(canonicalRequest);
    console.log('');

    // Create string to sign
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    console.log('📝 String to Sign:');
    console.log(stringToSign);
    console.log('');

    // Calculate signature
    const signingKey = this.getSignatureKey(this.config.secretAccessKey, dateStamp, 'auto', 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    console.log('🔑 Signature:', signature);
    console.log('');

    return `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<UploadResult> {
    const storageKey = this.generateStorageKey(file.originalname);
    const objectPath = `/${this.config.bucketName}/${storageKey}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').replace(/\.\d{3}Z$/, '000000Z');
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const headers: Record<string, string> = {
      'host': `${this.config.accountId}.r2.cloudflarestorage.com`,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'content-type': file.mimetype,
    };

    const authorization = this.signRequest(
      'PUT',
      objectPath,
      '',
      headers,
      payloadHash,
      dateStamp,
      amzDate
    );

    const requestHeaders: Record<string, string> = {
      'Host': headers['host'],
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Content-Type': file.mimetype,
      'Authorization': authorization,
    };

    console.log('📤 Uploading to:', `${this.endpoint}${objectPath}`);

    try {
      // Node Buffer is a Uint8Array subclass; wrap explicitly to satisfy
      // the strict BodyInit type from undici types used in Node 22+.
      const body = new Uint8Array(file.buffer);
      const response = await fetch(`${this.endpoint}${objectPath}`, {
        method: 'PUT',
        headers: requestHeaders,
        body,
      });

      console.log('📥 Response Status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Response Body:', text);
        throw new Error(`Upload failed: ${response.status} ${text}`);
      }

      const publicUrl = this.config.publicUrl
        ? `${this.config.publicUrl}/${storageKey}`
        : `${this.endpoint}/${this.config.bucketName}/${storageKey}`;

      return {
        storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        publicUrl,
      };
    } catch (error: any) {
      console.error('R2 Upload Error:', error);
      throw new AppError('Failed to upload file to storage', 500);
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(storageKey: string): Promise<void> {
    const objectPath = `/${this.config.bucketName}/${storageKey}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').replace(/\.\d{3}Z$/, '000000Z');
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = 'UNSIGNED-PAYLOAD';

    const headers: Record<string, string> = {
      'host': `${this.config.accountId}.r2.cloudflarestorage.com`,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    const authorization = this.signRequest(
      'DELETE',
      objectPath,
      '',
      headers,
      payloadHash,
      dateStamp,
      amzDate
    );

    const requestHeaders: Record<string, string> = {
      'Host': headers['host'],
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authorization,
    };

    try {
      const response = await fetch(`${this.endpoint}${objectPath}`, {
        method: 'DELETE',
        headers: requestHeaders,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Delete failed: ${response.status} ${text}`);
      }
    } catch (error: any) {
      console.error('R2 Delete Error:', error);
      throw new AppError('Failed to delete file from storage', 500);
    }
  }

  /**
   * Generate a presigned URL for temporary access
   */
  async getPresignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    const objectPath = `/${this.config.bucketName}/${storageKey}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').replace(/\.\d{3}Z$/, '000000Z');
    const dateStamp = amzDate.substring(0, 8);

    const expires = Math.floor(Date.now() / 1000) + expiresIn;

    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const queryParams = [
      `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
      `X-Amz-Credential=${encodeURIComponent(this.config.accessKeyId + '/' + credentialScope)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expires}`,
      `X-Amz-SignedHeaders=host`,
    ].sort().join('&');

    // Create canonical request for presigned URL
    const canonicalHeaders = `host:${this.config.accountId}.r2.cloudflarestorage.com\n`;
    const canonicalRequest = [
      'GET',
      objectPath,
      queryParams,
      canonicalHeaders,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    const signingKey = this.getSignatureKey(this.config.secretAccessKey, dateStamp, 'auto', 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    return `${this.endpoint}${objectPath}?${queryParams}&X-Amz-Signature=${signature}`;
  }

  /**
   * Generate a unique storage key for the file
   */
  private generateStorageKey(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = originalName.split('.').pop() || '';
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `uploads/${year}/${month}/${timestamp}-${randomString}.${extension}`;
  }
}

// Export singleton instance
export const r2Service = new R2Service();
