import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  Attendance,
  WFHApplication,
  AttendanceSummary,
  ClockInRequest,
  ClockOutRequest,
  WFHApplicationRequest,
  AttendanceQueryParams,
  WFHQueryParams,
  PaginatedResponse,
  ApiResponse
} from '../models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.apiUrl}/attendance`;

  // Clock In
  clockIn(request: ClockInRequest): Observable<ApiResponse<Attendance>> {
    return this.http.post<ApiResponse<Attendance>>(`${this.apiUrl}/clock-in`, request).pipe(
      catchError(this.handleError)
    );
  }

  // Clock Out
  clockOut(request: ClockOutRequest): Observable<ApiResponse<Attendance>> {
    return this.http.post<ApiResponse<Attendance>>(`${this.apiUrl}/clock-out`, request).pipe(
      catchError(this.handleError)
    );
  }

  // Get all attendance records with pagination and filtering
  getAllAttendance(params?: AttendanceQueryParams): Observable<PaginatedResponse<Attendance>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof AttendanceQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Attendance>>(this.apiUrl, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  // Get single attendance record by ID
  getAttendanceById(id: number): Observable<ApiResponse<Attendance>> {
    return this.http.get<ApiResponse<Attendance>>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Update attendance record
  updateAttendance(id: number, data: Partial<Attendance>): Observable<ApiResponse<Attendance>> {
    return this.http.put<ApiResponse<Attendance>>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.handleError)
    );
  }

  // Delete attendance record
  deleteAttendance(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Get attendance summary for an employee
  getAttendanceSummary(employeeId: number, month?: number, year?: number): Observable<ApiResponse<AttendanceSummary>> {
    let httpParams = new HttpParams();
    if (month) httpParams = httpParams.set('month', month.toString());
    if (year) httpParams = httpParams.set('year', year.toString());

    return this.http.get<ApiResponse<AttendanceSummary>>(`${this.apiUrl}/summary/${employeeId}`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  // Get today's attendance for an employee
  getTodayAttendance(employeeId: number): Observable<PaginatedResponse<Attendance>> {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    let httpParams = new HttpParams()
      .set('employee_id', employeeId.toString())
      .set('start_date', today)
      .set('end_date', today)
      .set('limit', '1');

    return this.http.get<PaginatedResponse<Attendance>>(`${this.apiUrl}`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  // Apply for WFH
  applyWFH(request: WFHApplicationRequest): Observable<ApiResponse<WFHApplication>> {
    return this.http.post<ApiResponse<WFHApplication>>(`${this.apiUrl}/wfh`, request).pipe(
      catchError(this.handleError)
    );
  }

  // Get all WFH applications with pagination and filtering
  getAllWFH(params?: WFHQueryParams): Observable<PaginatedResponse<WFHApplication>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof WFHQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<WFHApplication>>(`${this.apiUrl}/wfh`, { params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  // Approve or reject WFH application
  approveRejectWFH(id: number, action: 'approve' | 'reject', rejectionReason?: string): Observable<ApiResponse<WFHApplication>> {
    const body: { action: string; rejection_reason?: string } = { action };
    if (rejectionReason) {
      body.rejection_reason = rejectionReason;
    }
    return this.http.patch<ApiResponse<WFHApplication>>(`${this.apiUrl}/wfh/${id}/approve-reject`, body).pipe(
      catchError(this.handleError)
    );
  }

  // Submit WFH application
  submitWFHApplication(request: WFHApplicationRequest): Observable<ApiResponse<WFHApplication>> {
    return this.http.post<ApiResponse<WFHApplication>>(`${this.apiUrl}/wfh`, request).pipe(
      catchError(this.handleError)
    );
  }

  // Get WFH applications
  getWFHApplications(params?: WFHQueryParams): Observable<PaginatedResponse<WFHApplication>> {
    return this.getAllWFH(params);
  }

  // Cancel WFH application
  cancelWFHApplication(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/wfh/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || errorMessage;
    }

    console.error('Attendance Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
