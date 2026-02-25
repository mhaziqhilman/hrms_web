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

export interface UploaderInfo {
  id: number;
  name: string;
  email: string;
  employee?: { full_name: string };
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
  company_id?: number;
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
  uploader?: UploaderInfo;
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

export interface CategoryBreakdown {
  category: string;
  count: number;
  size: number;
}

export interface RecentActivity {
  id: number;
  original_filename: string;
  file_extension: string;
  category: string;
  uploaded_at: string;
  uploader: UploaderInfo | null;
}

export interface DocumentOverviewStats {
  total_documents: number;
  pending_verification: number;
  recently_uploaded: number;
  total_size: number;
  category_breakdown: CategoryBreakdown[];
  recent_activity: RecentActivity[];
}

export interface FileListFilters {
  category?: string;
  uploaded_by?: number;
  related_to_employee_id?: number;
  related_to_claim_id?: number;
  related_to_leave_id?: number;
  search?: string;
  is_verified?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
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
   * Get document overview stats (admin)
   */
  getDocumentOverview(): Observable<{ success: boolean; data: DocumentOverviewStats }> {
    return this.http.get<{ success: boolean; data: DocumentOverviewStats }>(`${this.apiUrl}/overview`);
  }

  /**
   * Get all files with filters
   */
  getFiles(filters?: FileListFilters): Observable<FileListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
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
   * Verify or unverify a file (admin only)
   */
  verifyFile(fileId: number, isVerified: boolean): Observable<FileResponse> {
    return this.http.patch<FileResponse>(`${this.apiUrl}/${fileId}/verify`, { is_verified: isVerified });
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
   * Get file icon based on MIME type (Lucide icon names)
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'file-text';
    if (mimeType.includes('word')) return 'file-type';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'file-spreadsheet';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'file-archive';
    if (mimeType.includes('text')) return 'file-text';
    return 'file';
  }

  /**
   * Get category display label
   */
  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'employee_document': 'Employee',
      'claim_receipt': 'Claims',
      'payslip': 'Payslip',
      'leave_document': 'Leave',
      'company_document': 'Company',
      'invoice': 'Invoice',
      'other': 'Other'
    };
    return labels[category] || category;
  }

  /**
   * Get category badge color class
   */
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'employee_document': 'bg-blue-100 text-blue-700',
      'claim_receipt': 'bg-purple-100 text-purple-700',
      'payslip': 'bg-green-100 text-green-700',
      'leave_document': 'bg-orange-100 text-orange-700',
      'company_document': 'bg-cyan-100 text-cyan-700',
      'invoice': 'bg-rose-100 text-rose-700',
      'other': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
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
