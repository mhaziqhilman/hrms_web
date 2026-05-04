import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import { Project, ProjectFilters, ProjectListResponse, ProjectTransactions } from '../models/project.model';

interface ApiResponse<T> { success: boolean; message?: string; data: T; }

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  list(filters: ProjectFilters = {}): Observable<ApiResponse<ProjectListResponse>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<ProjectListResponse>>(
      `${this.apiUrl}${API_CONFIG.endpoints.projects.base}`, { params }
    );
  }

  get(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(
      `${this.apiUrl}${API_CONFIG.endpoints.projects.detail(id)}`
    );
  }

  create(data: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(
      `${this.apiUrl}${API_CONFIG.endpoints.projects.base}`, data
    );
  }

  update(id: string, data: Partial<Project>): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(
      `${this.apiUrl}${API_CONFIG.endpoints.projects.detail(id)}`, data
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}${API_CONFIG.endpoints.projects.detail(id)}`
    );
  }

  transactions(id: string): Observable<ApiResponse<ProjectTransactions>> {
    return this.http.get<ApiResponse<ProjectTransactions>>(
      `${this.apiUrl}${API_CONFIG.endpoints.projects.transactions(id)}`
    );
  }
}
