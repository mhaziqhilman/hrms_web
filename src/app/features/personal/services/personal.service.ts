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
  MyPayslipsResponse
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
  downloadPayslipPdf(payrollId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.payslip(payrollId)}/pdf`,
      { responseType: 'blob' }
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
