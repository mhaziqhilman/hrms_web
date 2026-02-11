import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';

export interface UserEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
  employment_status: string;
  email?: string;
  mobile?: string;
}

export interface UserCompanyInfo {
  id: number;
  name: string;
}

export interface UserRecord {
  id: number;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  company_id: number | null;
  employee: UserEmployee | null;
  company: UserCompanyInfo | null;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: string;
  company_id?: string;
}

export interface PaginationData {
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface UserListResponse {
  users: UserRecord[];
  pagination: PaginationData;
}

export interface UnlinkedEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  getUsers(params: UserListParams = {}): Observable<ApiResponse<UserListResponse>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.is_active) httpParams = httpParams.set('is_active', params.is_active);
    if (params.company_id) httpParams = httpParams.set('company_id', params.company_id);

    return this.http.get<ApiResponse<UserListResponse>>(
      `${this.apiUrl}${API_CONFIG.endpoints.users.base}`,
      { params: httpParams }
    );
  }

  getUserById(id: number): Observable<ApiResponse<UserRecord>> {
    return this.http.get<ApiResponse<UserRecord>>(
      `${this.apiUrl}${API_CONFIG.endpoints.users.detail(id)}`
    );
  }

  updateUserRole(id: number, role: string): Observable<ApiResponse<UserRecord>> {
    return this.http.put<ApiResponse<UserRecord>>(
      `${this.apiUrl}${API_CONFIG.endpoints.users.updateRole(id)}`,
      { role }
    );
  }

  toggleUserActive(id: number, isActive: boolean): Observable<ApiResponse<UserRecord>> {
    return this.http.put<ApiResponse<UserRecord>>(
      `${this.apiUrl}${API_CONFIG.endpoints.users.toggleActive(id)}`,
      { is_active: isActive }
    );
  }

  linkUserToEmployee(userId: number, employeeId: number): Observable<ApiResponse<UserRecord>> {
    return this.http.put<ApiResponse<UserRecord>>(
      `${this.apiUrl}${API_CONFIG.endpoints.users.linkEmployee(userId)}`,
      { employee_id: employeeId }
    );
  }

  unlinkUserFromEmployee(userId: number): Observable<ApiResponse<UserRecord>> {
    return this.http.put<ApiResponse<UserRecord>>(
      `${this.apiUrl}${API_CONFIG.endpoints.users.unlinkEmployee(userId)}`,
      {}
    );
  }

  getUnlinkedEmployees(): Observable<ApiResponse<UnlinkedEmployee[]>> {
    return this.http.get<ApiResponse<UnlinkedEmployee[]>>(
      `${this.apiUrl}${API_CONFIG.endpoints.users.unlinkedEmployees}`
    );
  }

  resetUserPassword(userId: number, password: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.put<ApiResponse<{ message: string }>>(
      `${this.apiUrl}${API_CONFIG.endpoints.users.resetPassword(userId)}`,
      { password }
    );
  }
}
