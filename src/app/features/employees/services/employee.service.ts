import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeListParams,
  EmployeeListResponse,
  EmployeeYTD,
  EmployeeStatistics
} from '../models/employee.model';
import { ApiResponse } from '../../../core/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly apiUrl = API_CONFIG.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all employees with pagination and filtering
   */
  getEmployees(params?: EmployeeListParams): Observable<EmployeeListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.limit) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.employment_type) {
        httpParams = httpParams.set('employment_type', params.employment_type);
      }
      if (params.department) {
        httpParams = httpParams.set('department', params.department);
      }
    }

    return this.http.get<EmployeeListResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.base}`,
      { params: httpParams }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get employee by ID
   */
  getEmployeeById(id: number): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.detail(id)}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create new employee
   */
  createEmployee(data: CreateEmployeeRequest): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.base}`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update employee
   */
  updateEmployee(id: number, data: UpdateEmployeeRequest): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.detail(id)}`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete employee (soft delete - change status)
   */
  deleteEmployee(id: number, status: 'Resigned' | 'Terminated', reason?: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.detail(id)}`,
      {
        body: { status, reason }
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get employee YTD statutory summary
   */
  getEmployeeYTD(id: number, year?: number): Observable<ApiResponse<EmployeeYTD>> {
    let httpParams = new HttpParams();
    if (year) {
      httpParams = httpParams.set('year', year.toString());
    }

    return this.http.get<ApiResponse<EmployeeYTD>>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.ytd(id)}`,
      { params: httpParams }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get employee statistics
   */
  getEmployeeStatistics(): Observable<ApiResponse<EmployeeStatistics>> {
    return this.http.get<ApiResponse<EmployeeStatistics>>(
      `${this.apiUrl}${API_CONFIG.endpoints.employees.statistics}`
    ).pipe(
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

    console.error('Employee Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
