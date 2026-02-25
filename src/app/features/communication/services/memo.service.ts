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
  private apiUrl = `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcements.base}`;

  createMemo(data: MemoFormData): Observable<ApiResponse<Memo>> {
    return this.http.post<ApiResponse<Memo>>(this.apiUrl, data);
  }

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

  getMemoById(id: number): Observable<ApiResponse<Memo>> {
    return this.http.get<ApiResponse<Memo>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcements.detail(id)}`
    );
  }

  updateMemo(id: number, data: Partial<MemoFormData>): Observable<ApiResponse<Memo>> {
    return this.http.put<ApiResponse<Memo>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcements.detail(id)}`,
      data
    );
  }

  deleteMemo(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcements.detail(id)}`
    );
  }

  acknowledgeMemo(id: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcements.acknowledge(id)}`,
      {}
    );
  }

  getMemoStatistics(id: number): Observable<ApiResponse<MemoStatistics>> {
    return this.http.get<ApiResponse<MemoStatistics>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcements.statistics(id)}`
    );
  }

  getPinnedMemos(): Observable<ApiResponse<Memo[]>> {
    return this.http.get<ApiResponse<Memo[]>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcements.pinned}`
    );
  }

  togglePin(id: number): Observable<ApiResponse<Memo>> {
    return this.http.post<ApiResponse<Memo>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcements.togglePin(id)}`,
      {}
    );
  }

  publishMemo(id: number): Observable<ApiResponse<Memo>> {
    return this.updateMemo(id, { status: 'Published', published_at: new Date().toISOString() });
  }

  archiveMemo(id: number): Observable<ApiResponse<Memo>> {
    return this.updateMemo(id, { status: 'Archived' });
  }
}
