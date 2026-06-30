import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import {
  CashFlowStatement, CashFlowSummary, CashFlowTemplate,
  CashFlowLine, CreateCashFlowPayload
} from '../models/cashflow.model';

interface ApiResponse<T> { success: boolean; message?: string; data: T; }

@Injectable({ providedIn: 'root' })
export class CashFlowService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;
  private ep = API_CONFIG.endpoints.cashflow;

  list(): Observable<ApiResponse<CashFlowSummary[]>> {
    return this.http.get<ApiResponse<CashFlowSummary[]>>(`${this.apiUrl}${this.ep.base}`);
  }

  getTemplate(): Observable<ApiResponse<CashFlowTemplate>> {
    return this.http.get<ApiResponse<CashFlowTemplate>>(`${this.apiUrl}${this.ep.template}`);
  }

  get(id: string): Observable<ApiResponse<CashFlowStatement>> {
    return this.http.get<ApiResponse<CashFlowStatement>>(`${this.apiUrl}${this.ep.detail(id)}`);
  }

  create(payload: CreateCashFlowPayload): Observable<ApiResponse<CashFlowStatement>> {
    return this.http.post<ApiResponse<CashFlowStatement>>(`${this.apiUrl}${this.ep.base}`, payload);
  }

  update(id: string, payload: Partial<CreateCashFlowPayload>): Observable<ApiResponse<CashFlowStatement>> {
    return this.http.put<ApiResponse<CashFlowStatement>>(`${this.apiUrl}${this.ep.detail(id)}`, payload);
  }

  remove(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}${this.ep.detail(id)}`);
  }

  saveLines(id: string, lines: CashFlowLine[]): Observable<ApiResponse<CashFlowStatement>> {
    return this.http.put<ApiResponse<CashFlowStatement>>(`${this.apiUrl}${this.ep.lines(id)}`, { lines });
  }

  pullActuals(id: string): Observable<ApiResponse<CashFlowStatement>> {
    return this.http.post<ApiResponse<CashFlowStatement>>(`${this.apiUrl}${this.ep.actuals(id)}`, {});
  }

  downloadPdf(id: string, view: 'projected' | 'actual' = 'projected', font?: string): Observable<Blob> {
    let params = new HttpParams().set('view', view);
    if (font) params = params.set('font', font);
    return this.http.get(`${this.apiUrl}${this.ep.pdf(id)}`, { params, responseType: 'blob' });
  }
}
