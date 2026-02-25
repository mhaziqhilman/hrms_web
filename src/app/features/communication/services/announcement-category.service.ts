import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { AnnouncementCategory } from '../models/memo.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface CategoriesResponse {
  success: boolean;
  data: {
    categories: AnnouncementCategory[];
    totalCount: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementCategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcementCategories.base}`;

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(this.apiUrl);
  }

  createCategory(data: { name: string; color?: string; icon?: string }): Observable<ApiResponse<AnnouncementCategory>> {
    return this.http.post<ApiResponse<AnnouncementCategory>>(this.apiUrl, data);
  }

  updateCategory(id: number, data: Partial<AnnouncementCategory>): Observable<ApiResponse<AnnouncementCategory>> {
    return this.http.put<ApiResponse<AnnouncementCategory>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcementCategories.detail(id)}`,
      data
    );
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.announcementCategories.detail(id)}`
    );
  }
}
