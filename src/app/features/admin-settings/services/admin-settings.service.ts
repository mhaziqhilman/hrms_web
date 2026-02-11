import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import {
  LeaveTypeConfig, ClaimTypeConfig, PublicHoliday,
  StatutoryConfigItem, EmailTemplateItem, EmailPreview,
  CompanyProfile, ApiResponse
} from '../models/admin-settings.models';

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  // ─── Company Profile ────────────────────────────────────────
  getCompany(): Observable<ApiResponse<CompanyProfile>> {
    return this.http.get<ApiResponse<CompanyProfile>>(`${this.apiUrl}${API_CONFIG.endpoints.company.me}`);
  }

  updateCompany(data: Partial<CompanyProfile>): Observable<ApiResponse<CompanyProfile>> {
    return this.http.put<ApiResponse<CompanyProfile>>(`${this.apiUrl}${API_CONFIG.endpoints.company.me}`, data);
  }

  uploadLogo(file: File): Observable<ApiResponse<{ logo_url: string; storage_path: string }>> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<ApiResponse<{ logo_url: string; storage_path: string }>>(`${this.apiUrl}${API_CONFIG.endpoints.company.logo}`, formData);
  }

  // ─── Leave Types ────────────────────────────────────────────
  getLeaveTypes(includeInactive = true): Observable<ApiResponse<LeaveTypeConfig[]>> {
    return this.http.get<ApiResponse<LeaveTypeConfig[]>>(`${this.apiUrl}${API_CONFIG.endpoints.leaveTypes.base}?include_inactive=${includeInactive}`);
  }

  createLeaveType(data: Partial<LeaveTypeConfig>): Observable<ApiResponse<LeaveTypeConfig>> {
    return this.http.post<ApiResponse<LeaveTypeConfig>>(`${this.apiUrl}${API_CONFIG.endpoints.leaveTypes.base}`, data);
  }

  updateLeaveType(id: number, data: Partial<LeaveTypeConfig>): Observable<ApiResponse<LeaveTypeConfig>> {
    return this.http.put<ApiResponse<LeaveTypeConfig>>(`${this.apiUrl}${API_CONFIG.endpoints.leaveTypes.detail(id)}`, data);
  }

  toggleLeaveType(id: number): Observable<ApiResponse<LeaveTypeConfig>> {
    return this.http.patch<ApiResponse<LeaveTypeConfig>>(`${this.apiUrl}${API_CONFIG.endpoints.leaveTypes.toggle(id)}`, {});
  }

  // ─── Claim Types ────────────────────────────────────────────
  getClaimTypes(includeInactive = true): Observable<ApiResponse<ClaimTypeConfig[]>> {
    return this.http.get<ApiResponse<ClaimTypeConfig[]>>(`${this.apiUrl}${API_CONFIG.endpoints.claimTypes.base}?include_inactive=${includeInactive}`);
  }

  createClaimType(data: Partial<ClaimTypeConfig>): Observable<ApiResponse<ClaimTypeConfig>> {
    return this.http.post<ApiResponse<ClaimTypeConfig>>(`${this.apiUrl}${API_CONFIG.endpoints.claimTypes.base}`, data);
  }

  updateClaimType(id: number, data: Partial<ClaimTypeConfig>): Observable<ApiResponse<ClaimTypeConfig>> {
    return this.http.put<ApiResponse<ClaimTypeConfig>>(`${this.apiUrl}${API_CONFIG.endpoints.claimTypes.detail(id)}`, data);
  }

  toggleClaimType(id: number): Observable<ApiResponse<ClaimTypeConfig>> {
    return this.http.patch<ApiResponse<ClaimTypeConfig>>(`${this.apiUrl}${API_CONFIG.endpoints.claimTypes.toggle(id)}`, {});
  }

  // ─── Public Holidays ───────────────────────────────────────
  getHolidays(year?: number): Observable<ApiResponse<PublicHoliday[]>> {
    const params = year ? `?year=${year}` : '';
    return this.http.get<ApiResponse<PublicHoliday[]>>(`${this.apiUrl}${API_CONFIG.endpoints.publicHolidays.base}${params}`);
  }

  createHoliday(data: Partial<PublicHoliday>): Observable<ApiResponse<PublicHoliday>> {
    return this.http.post<ApiResponse<PublicHoliday>>(`${this.apiUrl}${API_CONFIG.endpoints.publicHolidays.base}`, data);
  }

  updateHoliday(id: number, data: Partial<PublicHoliday>): Observable<ApiResponse<PublicHoliday>> {
    return this.http.put<ApiResponse<PublicHoliday>>(`${this.apiUrl}${API_CONFIG.endpoints.publicHolidays.detail(id)}`, data);
  }

  deleteHoliday(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}${API_CONFIG.endpoints.publicHolidays.detail(id)}`);
  }

  // ─── Statutory Config ──────────────────────────────────────
  getStatutoryConfig(): Observable<ApiResponse<StatutoryConfigItem[]>> {
    return this.http.get<ApiResponse<StatutoryConfigItem[]>>(`${this.apiUrl}${API_CONFIG.endpoints.statutoryConfig.base}`);
  }

  updateStatutoryConfig(configs: { config_key: string; config_value: string; effective_from?: string }[]): Observable<ApiResponse<StatutoryConfigItem[]>> {
    return this.http.put<ApiResponse<StatutoryConfigItem[]>>(`${this.apiUrl}${API_CONFIG.endpoints.statutoryConfig.base}`, { configs });
  }

  // ─── Email Templates ───────────────────────────────────────
  getEmailTemplates(): Observable<ApiResponse<EmailTemplateItem[]>> {
    return this.http.get<ApiResponse<EmailTemplateItem[]>>(`${this.apiUrl}${API_CONFIG.endpoints.emailTemplates.base}`);
  }

  getEmailTemplate(key: string): Observable<ApiResponse<EmailTemplateItem>> {
    return this.http.get<ApiResponse<EmailTemplateItem>>(`${this.apiUrl}${API_CONFIG.endpoints.emailTemplates.detail(key)}`);
  }

  updateEmailTemplate(key: string, data: { subject?: string; body?: string; is_active?: boolean }): Observable<ApiResponse<EmailTemplateItem>> {
    return this.http.put<ApiResponse<EmailTemplateItem>>(`${this.apiUrl}${API_CONFIG.endpoints.emailTemplates.detail(key)}`, data);
  }

  previewEmailTemplate(key: string): Observable<ApiResponse<EmailPreview>> {
    return this.http.post<ApiResponse<EmailPreview>>(`${this.apiUrl}${API_CONFIG.endpoints.emailTemplates.preview(key)}`, {});
  }

  resetEmailTemplate(key: string): Observable<ApiResponse<EmailTemplateItem>> {
    return this.http.post<ApiResponse<EmailTemplateItem>>(`${this.apiUrl}${API_CONFIG.endpoints.emailTemplates.reset(key)}`, {});
  }
}
