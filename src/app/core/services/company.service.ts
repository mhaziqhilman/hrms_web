import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, Company, CompanySetupRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);
  private readonly apiUrl = API_CONFIG.apiUrl;

  setupCompany(data: CompanySetupRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}${API_CONFIG.endpoints.company.setup}`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  getMyCompany(): Observable<ApiResponse<Company>> {
    return this.http.get<ApiResponse<Company>>(
      `${this.apiUrl}${API_CONFIG.endpoints.company.me}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateCompany(data: Partial<Company>): Observable<ApiResponse<Company>> {
    return this.http.put<ApiResponse<Company>>(
      `${this.apiUrl}${API_CONFIG.endpoints.company.me}`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    const errorMessage = error.error?.message || error.message || 'An error occurred';
    console.error('Company Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
