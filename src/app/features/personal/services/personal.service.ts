import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  EmployeeProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  MyPayslipsResponse,
  EmployeeDocumentsResponse,
  TeamMembersResponse
} from '../models/personal.model';

@Injectable({
  providedIn: 'root'
})
export class PersonalService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  /**
   * Get own profile
   */
  getMyProfile(): Observable<EmployeeProfileResponse> {
    return this.http.get<EmployeeProfileResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.me}`
    );
  }

  /**
   * Update own profile
   */
  updateMyProfile(data: UpdateProfileRequest): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.me}`,
      data
    );
  }

  /**
   * Change password
   */
  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.auth.changePassword}`,
      data
    );
  }

  /**
   * Get my payslips
   */
  getMyPayslips(page = 1, limit = 12, year?: number): Observable<MyPayslipsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<MyPayslipsResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.myPayslips}`,
      { params }
    );
  }

  /**
   * Download payslip PDF
   */
  downloadPayslipPdf(payrollId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.downloadPayslipPdf(payrollId)}`,
      { responseType: 'blob' }
    );
  }

  /**
   * Get my documents (all files related to current user)
   */
  getMyDocuments(options?: { search?: string; sort?: string; order?: string }): Observable<EmployeeDocumentsResponse> {
    let params = new HttpParams().set('limit', '100');
    if (options?.search) params = params.set('search', options.search);
    if (options?.sort) params = params.set('sort', options.sort);
    if (options?.order) params = params.set('order', options.order);

    return this.http.get<EmployeeDocumentsResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.files.myDocuments}`,
      { params }
    );
  }

  /**
   * Download a document file
   */
  downloadDocument(fileId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.files.download(fileId)}`,
      { responseType: 'blob' }
    );
  }

  /**
   * Get my team (direct reports or same-department members)
   */
  getMyTeam(): Observable<TeamMembersResponse> {
    return this.http.get<TeamMembersResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.myTeam}`
    );
  }

  /**
   * Helper to trigger file download
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
