import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  Policy,
  PolicyFormData,
  PolicyFilters,
  PolicyStatistics,
  PolicyCategory
} from '../models/policy.model';

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
export class PolicyService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.apiUrl}/policies`;

  // Create a new policy
  createPolicy(data: PolicyFormData): Observable<ApiResponse<Policy>> {
    return this.http.post<ApiResponse<Policy>>(this.apiUrl, data);
  }

  // Get all policies with pagination and filtering
  getAllPolicies(filters?: PolicyFilters): Observable<PaginatedResponse<Policy>> {
    let httpParams = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof PolicyFilters];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            httpParams = httpParams.set(key, JSON.stringify(value));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<PaginatedResponse<Policy>>(this.apiUrl, { params: httpParams });
  }

  // Get single policy by ID
  getPolicyById(id: number): Observable<ApiResponse<Policy>> {
    return this.http.get<ApiResponse<Policy>>(`${this.apiUrl}/${id}`);
  }

  // Update policy
  updatePolicy(id: number, data: Partial<PolicyFormData>): Observable<ApiResponse<Policy>> {
    return this.http.put<ApiResponse<Policy>>(`${this.apiUrl}/${id}`, data);
  }

  // Delete policy
  deletePolicy(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Approve policy (Admin only)
  approvePolicy(id: number): Observable<ApiResponse<Policy>> {
    return this.http.post<ApiResponse<Policy>>(`${this.apiUrl}/${id}/approve`, {});
  }

  // Acknowledge policy
  acknowledgePolicy(id: number, comments?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/acknowledge`, { comments });
  }

  // Get policy statistics
  getPolicyStatistics(id: number): Observable<ApiResponse<PolicyStatistics>> {
    return this.http.get<ApiResponse<PolicyStatistics>>(`${this.apiUrl}/${id}/statistics`);
  }

  // Get policy categories with counts
  getPolicyCategories(): Observable<ApiResponse<PolicyCategory[]>> {
    return this.http.get<ApiResponse<PolicyCategory[]>>(`${this.apiUrl}/categories`);
  }

  // Activate policy
  activatePolicy(id: number): Observable<ApiResponse<Policy>> {
    return this.updatePolicy(id, { status: 'Active' });
  }

  // Archive policy
  archivePolicy(id: number): Observable<ApiResponse<Policy>> {
    return this.updatePolicy(id, { status: 'Archived' });
  }
}
