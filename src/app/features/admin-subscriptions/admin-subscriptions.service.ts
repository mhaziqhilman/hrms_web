import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import { AdminSubscriptionRow, Subscription } from '@/core/models/subscription.models';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminSubscriptionFilters {
  page?: number;
  limit?: number;
  search?: string;
  packageSlug?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminSubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  list(filters: AdminSubscriptionFilters = {}): Observable<ApiResponse<AdminSubscriptionRow[]>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.packageSlug) params = params.set('packageSlug', filters.packageSlug);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get<ApiResponse<AdminSubscriptionRow[]>>(
      `${this.apiUrl}${API_CONFIG.endpoints.adminSubscriptions.base}`,
      { params }
    );
  }

  override(userId: number, slug: string, reason?: string): Observable<ApiResponse<Subscription>> {
    return this.http.patch<ApiResponse<Subscription>>(
      `${this.apiUrl}${API_CONFIG.endpoints.adminSubscriptions.detail(userId)}`,
      { slug, reason }
    );
  }

  grantTrial(userId: number, slug = 'professional', reason?: string): Observable<ApiResponse<Subscription>> {
    return this.http.post<ApiResponse<Subscription>>(
      `${this.apiUrl}${API_CONFIG.endpoints.adminSubscriptions.grantTrial(userId)}`,
      { slug, reason }
    );
  }
}
