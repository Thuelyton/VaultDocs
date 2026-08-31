/**
 * Upload Service
 * Handles file upload to API
 *
 * Uses `expo-file-system`'s native upload task (HTTP/1.1 multipart backed by
 * NSURLSession on iOS and OkHttp on Android) instead of `fetch`+`FormData`.
 *
 * Why? React Native's `fetch` + `FormData` with the `{ uri, name, type }` shape
 * does NOT reliably send binary content: the file descriptor gets serialized as
 * the string "[object Object]" inside the multipart body, and the server sees
 * `req.body.file === "[object Object]"` instead of a real file. Multer then has
 * nothing to attach to `req.file`, and uploads silently fail.
 *
 * The native `File.createUploadTask` reads the file directly from disk and
 * streams it as proper multipart/form-data with the correct boundary,
 * sidestepping the issue entirely.
 */

import * as SecureStore from '../utils/secureStorage';
import { API_CONFIG } from '../config/api';
import { File, UploadType } from 'expo-file-system';

// Token storage key
const TOKEN_KEY = '@vaultdocs:token';

/**
 * Upload Response Interface
 */
export interface UploadResponse {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
}

/**
 * Upload with Document Response
 */
export interface UploadDocumentResponse {
  document: {
    _id: string;
    title: string;
    category: string;
    // ... other document fields
  };
  file: {
    publicUrl: string;
  };
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
}

/**
 * Detect MIME type from filename extension
 */
function detectMimeType(filename: string): string {
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : '';

  if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'doc' || ext === 'docx') return 'application/msword';

  return 'application/octet-stream';
}

/**
 * Get auth token
 */
async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Native multipart upload via expo-file-system.
 * Throws on non-2xx HTTP responses or network failures.
 */
async function nativeMultipartUpload(opts: {
  url: string;
  fileUri: string;
  filename: string;
  mimeType: string;
  fieldName: string;
  parameters: Record<string, string>;
  token: string | null;
  onProgress?: (percent: number) => void;
}): Promise<{ status: number; body: any }> {
  const file = new File(opts.fileUri);

  const headers: Record<string, string> = {};
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const task = file.createUploadTask(opts.url, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: opts.fieldName,
    mimeType: opts.mimeType,
    parameters: opts.parameters,
    headers,
    onProgress: opts.onProgress
      ? ({ totalBytes, bytesSent }) => {
          if (totalBytes > 0) {
            opts.onProgress!(Math.round((bytesSent / totalBytes) * 100));
          }
        }
      : undefined,
  });

  const result = await task.uploadAsync();

  const status = result?.status ?? 0;
  let body: any = null;
  const text = result?.body;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  return { status, body };
}

/**
 * Upload Service class
 */
class UploadService {
  /**
   * Upload a single file (POST /upload)
   */
  async uploadFile(
    uri: string,
    fieldName: string = 'file',
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> {
    const filename = uri.split('/').pop() || 'file.jpg';
    const type = detectMimeType(filename);
    const token = await getToken();

    const { status, body } = await nativeMultipartUpload({
      url: `${API_CONFIG.BASE_URL}/upload`,
      fileUri: uri,
      filename,
      mimeType: type,
      fieldName,
      parameters: {},
      token,
      onProgress,
    });

    if (status < 200 || status >= 300) {
      throw new Error(body?.message || `Upload failed with status ${status}`);
    }

    return body.data as UploadResponse;
  }

  /**
   * Upload file and create document in one step (POST /upload/document)
   */
  async uploadAndCreateDocument(
    uri: string,
    title: string,
    category: string,
    expirationDate?: string,
    extractedData?: Record<string, any>,
    onProgress?: (percent: number) => void
  ): Promise<UploadDocumentResponse> {
    const filename = uri.split('/').pop() || 'file.jpg';
    const type = detectMimeType(filename);
    const token = await getToken();

    const parameters: Record<string, string> = { title, category };
    if (expirationDate) parameters.expirationDate = expirationDate;
    if (extractedData) parameters.extractedData = JSON.stringify(extractedData);

    console.log('📤 Uploading file (native multipart):', { filename, type, title, category });

    const { status, body } = await nativeMultipartUpload({
      url: `${API_CONFIG.BASE_URL}/upload/document`,
      fileUri: uri,
      filename,
      mimeType: type,
      fieldName: 'file',
      parameters,
      token,
      onProgress,
    });

    if (status < 200 || status >= 300) {
      console.error('❌ Upload error:', body);
      throw new Error(body?.message || `Upload failed with status ${status}`);
    }

    console.log('✅ Upload success:', body);
    return body.data as UploadDocumentResponse;
  }

  /**
   * Delete a file from storage (DELETE /upload/:storageKey)
   */
  async deleteFile(storageKey: string): Promise<void> {
    const token = await getToken();
    const encodedKey = encodeURIComponent(storageKey);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_CONFIG.BASE_URL}/upload/${encodedKey}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok && response.status !== 204) {
      let body: any = null;
      try {
        body = await response.json();
      } catch {
        // ignore
      }
      throw new Error(body?.message || `Delete failed with status ${response.status}`);
    }
  }
}

// Export singleton instance
export const uploadService = new UploadService();
