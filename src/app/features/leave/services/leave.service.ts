import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  Leave,
  LeaveListParams,
  LeaveListResponse,
  LeaveResponse,
  ApplyLeaveRequest,
  UpdateLeaveRequest,
  ApproveRejectLeaveRequest,
  LeaveBalanceResponse
} from '../models/leave.model';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  /**
   * Get all leave applications with pagination and filtering
   */
  getLeaves(params?: LeaveListParams): Observable<LeaveListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.employee_id) httpParams = httpParams.set('employee_id', params.employee_id.toString());
      if (params.leave_type_id) httpParams = httpParams.set('leave_type_id', params.leave_type_id.toString());
      if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
      if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
    }

    return this.http.get<LeaveListResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.leaves.base}`,
      { params: httpParams }
    );
  }

  /**
   * Get single leave application by ID
   */
  getLeaveById(id: number): Observable<LeaveResponse> {
    return this.http.get<LeaveResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.leaves.detail(id)}`
    );
  }

  /**
   * Apply for leave
   */
  applyLeave(request: ApplyLeaveRequest): Observable<LeaveResponse> {
    return this.http.post<LeaveResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.leaves.base}`,
      request
    );
  }

  /**
   * Update leave application
   */
  updateLeave(id: number, request: UpdateLeaveRequest): Observable<LeaveResponse> {
    return this.http.put<LeaveResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.leaves.detail(id)}`,
      request
    );
  }

  /**
   * Approve or reject leave application
   */
  approveRejectLeave(id: number, request: ApproveRejectLeaveRequest): Observable<LeaveResponse> {
    return this.http.patch<LeaveResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.leaves.approveReject(id)}`,
      request
    );
  }

  /**
   * Cancel leave application
   */
  cancelLeave(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}${API_CONFIG.endpoints.leaves.detail(id)}`
    );
  }

  /**
   * Get leave balance for an employee
   */
  getLeaveBalance(employee_id: number, year?: number): Observable<LeaveBalanceResponse> {
    let httpParams = new HttpParams();
    if (year) {
      httpParams = httpParams.set('year', year.toString());
    }

    return this.http.get<LeaveBalanceResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.leaves.balance(employee_id)}`,
      { params: httpParams }
    );
  }
}
