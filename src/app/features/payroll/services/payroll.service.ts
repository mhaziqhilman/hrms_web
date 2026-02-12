import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  Payroll,
  PayrollListParams,
  PayrollListResponse,
  PayrollResponse,
  CalculatePayrollRequest,
  UpdatePayrollRequest,
  PayslipResponse,
  BulkActionResponse
} from '../models/payroll.model';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  /**
   * Get all payroll records with pagination and filtering
   */
  getPayrolls(params?: PayrollListParams): Observable<PayrollListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.year) httpParams = httpParams.set('year', params.year.toString());
      if (params.month) httpParams = httpParams.set('month', params.month.toString());
      if (params.employee_id) httpParams = httpParams.set('employee_id', params.employee_id.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<PayrollListResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.base}`,
      { params: httpParams }
    );
  }

  /**
   * Get single payroll record by ID
   */
  getPayrollById(id: number): Observable<PayrollResponse> {
    return this.http.get<PayrollResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.detail(id)}`
    );
  }

  /**
   * Calculate and create payroll for an employee
   */
  calculatePayroll(request: CalculatePayrollRequest): Observable<PayrollResponse> {
    return this.http.post<PayrollResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.calculate}`,
      request
    );
  }

  /**
   * Update payroll record
   */
  updatePayroll(id: number, request: UpdatePayrollRequest): Observable<PayrollResponse> {
    return this.http.put<PayrollResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.detail(id)}`,
      request
    );
  }

  /**
   * Submit payroll for approval (Draft -> Pending)
   */
  submitForApproval(id: number): Observable<PayrollResponse> {
    return this.http.patch<PayrollResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.submit(id)}`,
      {}
    );
  }

  /**
   * Approve payroll (Pending -> Approved)
   */
  approvePayroll(id: number): Observable<PayrollResponse> {
    return this.http.patch<PayrollResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.approve(id)}`,
      {}
    );
  }

  /**
   * Mark payroll as paid
   */
  markAsPaid(id: number): Observable<PayrollResponse> {
    return this.http.patch<PayrollResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.markPaid(id)}`,
      {}
    );
  }

  /**
   * Cancel payroll
   */
  cancelPayroll(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.detail(id)}`
    );
  }

  /**
   * Permanently delete a cancelled payroll record
   */
  permanentDeletePayroll(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.permanentDelete(id)}`
    );
  }

  /**
   * Generate payslip for a payroll record
   */
  getPayslip(id: number): Observable<PayslipResponse> {
    return this.http.get<PayslipResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.payslip(id)}`
    );
  }

  /**
   * Download payslip as PDF (placeholder - to be implemented)
   */
  downloadPayslip(id: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.payslip(id)}/pdf`,
      { responseType: 'blob' }
    );
  }

  bulkSubmitForApproval(payrollIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.bulkSubmit}`,
      { payroll_ids: payrollIds }
    );
  }

  bulkApprovePayrolls(payrollIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.bulkApprove}`,
      { payroll_ids: payrollIds }
    );
  }

  bulkMarkAsPaid(payrollIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.bulkMarkPaid}`,
      { payroll_ids: payrollIds }
    );
  }

  bulkCancelPayrolls(payrollIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.bulkCancel}`,
      { payroll_ids: payrollIds }
    );
  }

  bulkPermanentDelete(payrollIds: number[]): Observable<BulkActionResponse> {
    return this.http.post<BulkActionResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.payroll.bulkDelete}`,
      { payroll_ids: payrollIds }
    );
  }
}
