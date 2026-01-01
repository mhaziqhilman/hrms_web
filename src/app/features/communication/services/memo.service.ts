import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  Memo,
  MemoFormData,
  MemoFilters,
  MemoStatistics
} from '../models/memo.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MemoService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.apiUrl}/memos`;

  // Create a new memo
  createMemo(data: MemoFormData): Observable<ApiResponse<Memo>> {
    return this.http.post<ApiResponse<Memo>>(this.apiUrl, data);
  }

  // Get all memos with pagination and filtering
  getAllMemos(filters?: MemoFilters): Observable<PaginatedResponse<Memo>> {
    let httpParams = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof MemoFilters];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            httpParams = httpParams.set(key, JSON.stringify(value));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<PaginatedResponse<Memo>>(this.apiUrl, { params: httpParams });
  }

  // Get single memo by ID
  getMemoById(id: number): Observable<ApiResponse<Memo>> {
    return this.http.get<ApiResponse<Memo>>(`${this.apiUrl}/${id}`);
  }

  // Update memo
  updateMemo(id: number, data: Partial<MemoFormData>): Observable<ApiResponse<Memo>> {
    return this.http.put<ApiResponse<Memo>>(`${this.apiUrl}/${id}`, data);
  }

  // Delete memo
  deleteMemo(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Acknowledge memo
  acknowledgeMemo(id: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/acknowledge`, {});
  }

  // Get memo statistics
  getMemoStatistics(id: number): Observable<ApiResponse<MemoStatistics>> {
    return this.http.get<ApiResponse<MemoStatistics>>(`${this.apiUrl}/${id}/statistics`);
  }

  // Publish memo (change status from Draft to Published)
  publishMemo(id: number): Observable<ApiResponse<Memo>> {
    return this.updateMemo(id, { status: 'Published', published_at: new Date().toISOString() });
  }

  // Archive memo
  archiveMemo(id: number): Observable<ApiResponse<Memo>> {
    return this.updateMemo(id, { status: 'Archived' });
  }
}
