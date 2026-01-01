import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  Claim,
  ClaimType,
  ClaimSummary,
  SubmitClaimRequest,
  UpdateClaimRequest,
  ManagerApprovalRequest,
  FinanceApprovalRequest,
  ClaimQueryParams,
  PaginatedResponse,
  ApiResponse
} from '../models/claim.model';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.apiUrl}/claims`;

  // Submit a new claim
  submitClaim(request: SubmitClaimRequest): Observable<ApiResponse<Claim>> {
    return this.http.post<ApiResponse<Claim>>(this.apiUrl, request);
  }

  // Get all claims with pagination and filtering
  getAllClaims(params?: ClaimQueryParams): Observable<PaginatedResponse<Claim>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof ClaimQueryParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Claim>>(this.apiUrl, { params: httpParams });
  }

  // Get single claim by ID
  getClaimById(id: number): Observable<ApiResponse<Claim>> {
    return this.http.get<ApiResponse<Claim>>(`${this.apiUrl}/${id}`);
  }

  // Update claim (only pending claims)
  updateClaim(id: number, data: UpdateClaimRequest): Observable<ApiResponse<Claim>> {
    return this.http.put<ApiResponse<Claim>>(`${this.apiUrl}/${id}`, data);
  }

  // Delete claim
  deleteClaim(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Manager approval/rejection
  managerApproval(id: number, request: ManagerApprovalRequest): Observable<ApiResponse<Claim>> {
    return this.http.patch<ApiResponse<Claim>>(`${this.apiUrl}/${id}/manager-approval`, request);
  }

  // Finance approval/rejection or mark as paid
  financeApproval(id: number, request: FinanceApprovalRequest): Observable<ApiResponse<Claim>> {
    return this.http.patch<ApiResponse<Claim>>(`${this.apiUrl}/${id}/finance-approval`, request);
  }

  // Get claims summary for an employee
  getClaimsSummary(employeeId: number, month?: number, year?: number): Observable<ApiResponse<ClaimSummary>> {
    let httpParams = new HttpParams();
    if (month) httpParams = httpParams.set('month', month.toString());
    if (year) httpParams = httpParams.set('year', year.toString());

    return this.http.get<ApiResponse<ClaimSummary>>(`${this.apiUrl}/summary/${employeeId}`, { params: httpParams });
  }

  // Get all claim types
  getAllClaimTypes(): Observable<PaginatedResponse<ClaimType>> {
    return this.http.get<PaginatedResponse<ClaimType>>(`${API_CONFIG.apiUrl}/claim-types`);
  }
}
