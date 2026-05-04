import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import {
  Bill, BillFilters, BillListResponse, BillPayment,
  PnLSummary, SalesByMonth, ExpensesByCategory, ProjectPnl
} from '../models/finance.model';

interface ApiResponse<T> { success: boolean; message?: string; data: T; }

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  // ── Bills ──
  listBills(filters: BillFilters = {}): Observable<ApiResponse<BillListResponse>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<BillListResponse>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.base}`, { params }
    );
  }

  getBill(id: string): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.detail(id)}`
    );
  }

  createBill(data: any): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.base}`, data
    );
  }

  updateBill(id: string, data: any): Observable<ApiResponse<Bill>> {
    return this.http.put<ApiResponse<Bill>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.detail(id)}`, data
    );
  }

  deleteBill(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.detail(id)}`
    );
  }

  approveBill(id: string): Observable<ApiResponse<Bill>> {
    return this.http.patch<ApiResponse<Bill>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.approve(id)}`, {}
    );
  }

  cancelBill(id: string, reason?: string): Observable<ApiResponse<Bill>> {
    return this.http.patch<ApiResponse<Bill>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.cancel(id)}`, { reason }
    );
  }

  recordPayment(id: string, payment: Partial<BillPayment>): Observable<ApiResponse<BillPayment>> {
    return this.http.post<ApiResponse<BillPayment>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.payments(id)}`, payment
    );
  }

  deletePayment(billId: string, paymentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}${API_CONFIG.endpoints.bills.deletePayment(billId, paymentId)}`
    );
  }

  // ── Finance summaries ──
  getPnL(opts: { project_id?: string; from?: string; to?: string; include_payroll?: boolean } = {}): Observable<ApiResponse<PnLSummary>> {
    let params = new HttpParams();
    if (opts.project_id) params = params.set('project_id', opts.project_id);
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    if (opts.include_payroll === false) params = params.set('include_payroll', 'false');
    return this.http.get<ApiResponse<PnLSummary>>(
      `${this.apiUrl}${API_CONFIG.endpoints.finance.pnl}`, { params }
    );
  }

  getSales(year: number, project_id?: string): Observable<ApiResponse<SalesByMonth>> {
    let params = new HttpParams().set('year', String(year));
    if (project_id) params = params.set('project_id', project_id);
    return this.http.get<ApiResponse<SalesByMonth>>(
      `${this.apiUrl}${API_CONFIG.endpoints.finance.sales}`, { params }
    );
  }

  getExpenses(opts: { from?: string; to?: string; project_id?: string } = {}): Observable<ApiResponse<ExpensesByCategory>> {
    let params = new HttpParams();
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    if (opts.project_id) params = params.set('project_id', opts.project_id);
    return this.http.get<ApiResponse<ExpensesByCategory>>(
      `${this.apiUrl}${API_CONFIG.endpoints.finance.expenses}`, { params }
    );
  }

  getProjectsPnl(opts: { from?: string; to?: string } = {}): Observable<ApiResponse<ProjectPnl[]>> {
    let params = new HttpParams();
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    return this.http.get<ApiResponse<ProjectPnl[]>>(
      `${this.apiUrl}${API_CONFIG.endpoints.finance.projectsPnl}`, { params }
    );
  }
}
