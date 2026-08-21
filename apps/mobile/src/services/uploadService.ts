/**
 * Upload Service
 * Handles file upload to API
 */

import apiClient from '../api/client';
import * as FileSystem from 'expo-file-system';

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
 * Upload Service class
 */
class UploadService {
  /**
   * Upload a single file
   */
  async uploadFile(uri: string, fieldName: string = 'file'): Promise<UploadResponse> {
    // Create form data
    const formData = new FormData();
    
    // Get file info
    const filename = uri.split('/').pop() || 'file.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Append file
    formData.append(fieldName, {
      uri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post<ApiResponse<UploadResponse>>(
      '/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Upload file and create document in one step
   */
  async uploadAndCreateDocument(
    uri: string,
    title: string,
    category: string,
    expirationDate: string,
    extractedData?: Record<string, any>
  ): Promise<UploadDocumentResponse> {
    // Create form data
    const formData = new FormData();
    
    // Get file info
    const filename = uri.split('/').pop() || 'file.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Append file and metadata
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('expirationDate', expirationDate);
    
    if (extractedData) {
      formData.append('extractedData', JSON.stringify(extractedData));
    }

    const response = await apiClient.post<ApiResponse<UploadDocumentResponse>>(
      '/upload/document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storageKey: string): Promise<void> {
    const encodedKey = encodeURIComponent(storageKey);
    await apiClient.delete(`/upload/${encodedKey}`);
  }
}

// Export singleton instance
export const uploadService = new UploadService();
