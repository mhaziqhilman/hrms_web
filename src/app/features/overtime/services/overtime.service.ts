import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  Overtime,
  SubmitOvertimeRequest,
  UpdateOvertimeRequest,
  OvertimeApprovalRequest,
  OvertimeQueryParams,
  DayTypeSuggestion,
  AttendanceSuggestion,
  ApprovedOvertimeTotal,
  PaginatedResponse,
  ApiResponse
} from '../models/overtime.model';

@Injectable({ providedIn: 'root' })
export class OvertimeService {
  private http = inject(HttpClient);
  private endpoints = API_CONFIG.endpoints.overtime;
  private base = `${API_CONFIG.apiUrl}${this.endpoints.base}`;

  submitOvertime(request: SubmitOvertimeRequest): Observable<ApiResponse<Overtime>> {
    return this.http.post<ApiResponse<Overtime>>(this.base, request);
  }

  getAllOvertime(params?: OvertimeQueryParams): Observable<PaginatedResponse<Overtime>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof OvertimeQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<Overtime>>(this.base, { params: httpParams });
  }

  getTeamOvertime(status?: string): Observable<ApiResponse<Overtime[]>> {
    let httpParams = new HttpParams();
    if (status) httpParams = httpParams.set('status', status);
    return this.http.get<ApiResponse<Overtime[]>>(
      `${API_CONFIG.apiUrl}${this.endpoints.team}`,
      { params: httpParams }
    );
  }

  getOvertimeById(id: number | string): Observable<ApiResponse<Overtime>> {
    return this.http.get<ApiResponse<Overtime>>(`${API_CONFIG.apiUrl}${this.endpoints.detail(id)}`);
  }

  updateOvertime(id: number | string, data: UpdateOvertimeRequest): Observable<ApiResponse<Overtime>> {
    return this.http.put<ApiResponse<Overtime>>(`${API_CONFIG.apiUrl}${this.endpoints.detail(id)}`, data);
  }

  deleteOvertime(id: number | string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_CONFIG.apiUrl}${this.endpoints.detail(id)}`);
  }

  approval(id: number | string, request: OvertimeApprovalRequest): Observable<ApiResponse<Overtime>> {
    return this.http.patch<ApiResponse<Overtime>>(`${API_CONFIG.apiUrl}${this.endpoints.approval(id)}`, request);
  }

  suggestDayType(date: string): Observable<ApiResponse<DayTypeSuggestion>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<DayTypeSuggestion>>(
      `${API_CONFIG.apiUrl}${this.endpoints.suggestDayType}`,
      { params }
    );
  }

  suggestFromAttendance(date: string, employeeId?: number | string): Observable<ApiResponse<AttendanceSuggestion>> {
    let params = new HttpParams().set('date', date);
    if (employeeId) params = params.set('employee_id', employeeId.toString());
    return this.http.get<ApiResponse<AttendanceSuggestion>>(
      `${API_CONFIG.apiUrl}${this.endpoints.suggestFromAttendance}`,
      { params }
    );
  }

  getApprovedTotal(employeeId: number | string, year: number, month: number): Observable<ApiResponse<ApprovedOvertimeTotal>> {
    const params = new HttpParams()
      .set('employee_id', employeeId.toString())
      .set('year', year.toString())
      .set('month', month.toString());
    return this.http.get<ApiResponse<ApprovedOvertimeTotal>>(
      `${API_CONFIG.apiUrl}${this.endpoints.approvedTotal}`,
      { params }
    );
  }
}
