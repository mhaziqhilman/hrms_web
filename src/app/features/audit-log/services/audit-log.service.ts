import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import { AuditLog, AuditLogFilters, ApiResponse } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  getAuditLogs(filters: AuditLogFilters = {}): Observable<ApiResponse<AuditLog[]>> {
    let params = new HttpParams();
    if (filters.action) params = params.set('action', filters.action);
    if (filters.entity_type) params = params.set('entity_type', filters.entity_type);
    if (filters.user_id) params = params.set('user_id', filters.user_id.toString());
    if (filters.company_id) params = params.set('company_id', filters.company_id.toString());
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ApiResponse<AuditLog[]>>(
      `${this.apiUrl}${API_CONFIG.endpoints.auditLogs.base}`,
      { params }
    );
  }
}
