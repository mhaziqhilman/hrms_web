import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface FileUploadMetadata {
  category: 'employee_document' | 'claim_receipt' | 'payslip' | 'leave_document' | 'company_document' | 'invoice' | 'other';
  sub_category?: string;
  description?: string;
  related_to_employee_id?: number;
  related_to_claim_id?: number;
  related_to_leave_id?: number;
  related_to_payroll_id?: number;
  related_to_invoice_id?: number;
  is_public?: boolean;
}

export interface FileMetadata {
  id: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  category: string;
  sub_category?: string;
  uploaded_by: number;
  related_to_employee_id?: number;
  related_to_claim_id?: number;
  related_to_leave_id?: number;
  related_to_payroll_id?: number;
  related_to_invoice_id?: number;
  description?: string;
  tags?: string[];
  is_public: boolean;
  is_verified: boolean;
  status: 'active' | 'archived' | 'deleted';
  uploaded_at: string;
  deleted_at?: string;
  deleted_by?: number;
}

export interface FileListResponse {
  success: boolean;
  data: FileMetadata[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FileResponse {
  success: boolean;
  message?: string;
  data?: FileMetadata | FileMetadata[];
}

export interface StorageStats {
  total_files: number;
  total_size: number;
  by_category: Array<{
    category: string;
    count: number;
    size: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.apiUrl}/files`;

  /**
   * Upload single or multiple files
   */
  uploadFiles(files: File[], metadata: FileUploadMetadata): Observable<FileResponse> {
    const formData = new FormData();

    // Append files
    files.forEach(file => {
      formData.append('files', file);
    });

    // Append metadata
    formData.append('category', metadata.category);
    if (metadata.sub_category) formData.append('sub_category', metadata.sub_category);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.related_to_employee_id) formData.append('related_to_employee_id', metadata.related_to_employee_id.toString());
    if (metadata.related_to_claim_id) formData.append('related_to_claim_id', metadata.related_to_claim_id.toString());
    if (metadata.related_to_leave_id) formData.append('related_to_leave_id', metadata.related_to_leave_id.toString());
    if (metadata.related_to_payroll_id) formData.append('related_to_payroll_id', metadata.related_to_payroll_id.toString());
    if (metadata.related_to_invoice_id) formData.append('related_to_invoice_id', metadata.related_to_invoice_id.toString());
    if (metadata.is_public !== undefined) formData.append('is_public', metadata.is_public.toString());

    return this.http.post<FileResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Upload files with progress tracking
   */
  uploadFilesWithProgress(files: File[], metadata: FileUploadMetadata): Observable<HttpEvent<FileResponse>> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    formData.append('category', metadata.category);
    if (metadata.sub_category) formData.append('sub_category', metadata.sub_category);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.related_to_employee_id) formData.append('related_to_employee_id', metadata.related_to_employee_id.toString());
    if (metadata.related_to_claim_id) formData.append('related_to_claim_id', metadata.related_to_claim_id.toString());
    if (metadata.related_to_leave_id) formData.append('related_to_leave_id', metadata.related_to_leave_id.toString());

    return this.http.post<FileResponse>(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Get all files with filters
   */
  getFiles(filters?: {
    category?: string;
    uploaded_by?: number;
    related_to_employee_id?: number;
    related_to_claim_id?: number;
    related_to_leave_id?: number;
    page?: number;
    limit?: number;
  }): Observable<FileListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<FileListResponse>(this.apiUrl, { params });
  }

  /**
   * Get file metadata by ID
   */
  getFileById(fileId: number): Observable<FileResponse> {
    return this.http.get<FileResponse>(`${this.apiUrl}/${fileId}`);
  }

  /**
   * Download file
   */
  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Preview file (inline)
   */
  previewFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}/preview`, {
      responseType: 'blob'
    });
  }

  /**
   * Get preview URL for file
   */
  getPreviewUrl(fileId: number): string {
    return `${this.apiUrl}/${fileId}/preview`;
  }

  /**
   * Get download URL for file
   */
  getDownloadUrl(fileId: number): string {
    return `${this.apiUrl}/${fileId}/download`;
  }

  /**
   * Update file metadata
   */
  updateFileMetadata(fileId: number, updates: {
    description?: string;
    tags?: string[];
    sub_category?: string;
    is_verified?: boolean;
  }): Observable<FileResponse> {
    return this.http.put<FileResponse>(`${this.apiUrl}/${fileId}`, updates);
  }

  /**
   * Soft delete file
   */
  deleteFile(fileId: number): Observable<FileResponse> {
    return this.http.delete<FileResponse>(`${this.apiUrl}/${fileId}`);
  }

  /**
   * Permanently delete file (admin only)
   */
  permanentDeleteFile(fileId: number): Observable<FileResponse> {
    return this.http.delete<FileResponse>(`${this.apiUrl}/${fileId}/permanent`);
  }

  /**
   * Bulk delete files
   */
  bulkDeleteFiles(fileIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-delete`, { file_ids: fileIds });
  }

  /**
   * Get files by employee ID
   */
  getFilesByEmployee(employeeId: number, page?: number, limit?: number): Observable<FileListResponse> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());

    return this.http.get<FileListResponse>(`${this.apiUrl}/employee/${employeeId}`, { params });
  }

  /**
   * Get files by claim ID
   */
  getFilesByClaim(claimId: number, page?: number, limit?: number): Observable<FileListResponse> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());

    return this.http.get<FileListResponse>(`${this.apiUrl}/claim/${claimId}`, { params });
  }

  /**
   * Get storage statistics (admin only)
   */
  getStorageStats(): Observable<{ success: boolean; data: StorageStats }> {
    return this.http.get<{ success: boolean; data: StorageStats }>(`${this.apiUrl}/stats/storage`);
  }

  /**
   * Download file and save to disk
   */
  downloadAndSaveFile(fileId: number, filename: string): Observable<void> {
    return new Observable<void>(observer => {
      this.downloadFile(fileId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Download failed:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'grid_on';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'folder_zip';
    return 'insert_drive_file';
  }

  /**
   * Check if file can be previewed
   */
  canPreview(mimeType: string): boolean {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds 10MB limit. Current size: ${this.formatFileSize(file.size)}` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not supported` };
    }

    return { valid: true };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (files.length > 10) {
      errors.push('Maximum 10 files allowed per upload');
    }

    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
}
