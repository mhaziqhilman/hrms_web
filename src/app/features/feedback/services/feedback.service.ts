import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import {
  Feedback,
  FeedbackStats,
  FeedbackFilters,
  ApiResponse,
  SubmitFeedbackRequest
} from '../models/feedback.model';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  submitFeedback(data: SubmitFeedbackRequest): Observable<ApiResponse<Feedback>> {
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('rating', data.rating.toString());
    formData.append('description', data.description);
    if (data.page_url) {
      formData.append('page_url', data.page_url);
    }
    if (data.screenshot) {
      formData.append('screenshot', data.screenshot);
    }

    return this.http.post<ApiResponse<Feedback>>(
      `${this.apiUrl}${API_CONFIG.endpoints.feedback.base}`,
      formData
    );
  }

  getMyFeedback(page = 1, limit = 10): Observable<ApiResponse<Feedback[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<Feedback[]>>(
      `${this.apiUrl}${API_CONFIG.endpoints.feedback.my}`,
      { params }
    );
  }

  getAllFeedback(filters: FeedbackFilters = {}): Observable<ApiResponse<Feedback[]>> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.rating) params = params.set('rating', filters.rating.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.order) params = params.set('order', filters.order);

    return this.http.get<ApiResponse<Feedback[]>>(
      `${this.apiUrl}${API_CONFIG.endpoints.feedback.base}`,
      { params }
    );
  }

  getFeedbackStats(): Observable<ApiResponse<FeedbackStats>> {
    return this.http.get<ApiResponse<FeedbackStats>>(
      `${this.apiUrl}${API_CONFIG.endpoints.feedback.stats}`
    );
  }

  getFeedbackById(id: number): Observable<ApiResponse<Feedback>> {
    return this.http.get<ApiResponse<Feedback>>(
      `${this.apiUrl}${API_CONFIG.endpoints.feedback.detail(id)}`
    );
  }

  updateFeedbackStatus(id: number, status: string, admin_notes?: string): Observable<ApiResponse<Feedback>> {
    const body: any = { status };
    if (admin_notes !== undefined) {
      body.admin_notes = admin_notes;
    }
    return this.http.patch<ApiResponse<Feedback>>(
      `${this.apiUrl}${API_CONFIG.endpoints.feedback.updateStatus(id)}`,
      body
    );
  }

  deleteFeedback(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}${API_CONFIG.endpoints.feedback.detail(id)}`
    );
  }
}
