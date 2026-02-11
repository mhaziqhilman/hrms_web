import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, AuthResponse, Invitation } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  private readonly apiUrl = API_CONFIG.apiUrl;

  inviteUser(email: string, role: string = 'staff'): Observable<ApiResponse<Invitation>> {
    return this.http.post<ApiResponse<Invitation>>(
      `${this.apiUrl}${API_CONFIG.endpoints.invitations.base}`,
      { email, role }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getInvitationInfo(token: string): Observable<ApiResponse<{ email: string; role: string; status: string; expired: boolean; company: { name: string; logo_url: string } | null }>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}${API_CONFIG.endpoints.invitations.info}`,
      { params: { token } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  acceptInvitation(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.invitations.accept}`,
      { token }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getInvitations(params?: { page?: number; limit?: number; status?: string }): Observable<ApiResponse<{ invitations: Invitation[]; pagination: any }>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<ApiResponse<{ invitations: Invitation[]; pagination: any }>>(
      `${this.apiUrl}${API_CONFIG.endpoints.invitations.base}`,
      { params: httpParams }
    ).pipe(
      catchError(this.handleError)
    );
  }

  cancelInvitation(id: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.invitations.cancel(id)}`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  resendInvitation(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.invitations.resend(id)}`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  autoAccept(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.invitations.autoAccept}`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    const errorMessage = error.error?.message || error.message || 'An error occurred';
    console.error('Invitation Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
