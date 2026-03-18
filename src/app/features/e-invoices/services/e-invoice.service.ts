import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import {
  Invoice,
  InvoiceListFilters,
  InvoiceListResponse,
  InvoiceAnalytics,
  InvoicePayment,
  TinValidationResult,
  BulkSubmitResult
} from '../models/invoice.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class EInvoiceService {
  private http = inject(HttpClient);
  private baseUrl = `${API_CONFIG.apiUrl}/invoices`;

  // ─── CRUD ──────────────────────────────────────────────────

  getInvoices(filters: InvoiceListFilters = {}): Observable<ApiResponse<InvoiceListResponse>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<ApiResponse<InvoiceListResponse>>(this.baseUrl, { params });
  }

  getInvoice(publicId: string): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`${this.baseUrl}/${publicId}`);
  }

  createInvoice(data: Partial<Invoice> & { items: any[] }): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(this.baseUrl, data);
  }

  updateInvoice(publicId: string, data: Partial<Invoice> & { items?: any[] }): Observable<ApiResponse<Invoice>> {
    return this.http.put<ApiResponse<Invoice>>(`${this.baseUrl}/${publicId}`, data);
  }

  deleteInvoice(publicId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${publicId}`);
  }

  // ─── Workflow ──────────────────────────────────────────────

  approveInvoice(publicId: string): Observable<ApiResponse<Invoice>> {
    return this.http.patch<ApiResponse<Invoice>>(`${this.baseUrl}/${publicId}/approve`, {});
  }

  submitToLhdn(publicId: string): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(`${this.baseUrl}/${publicId}/submit`, {});
  }

  checkLhdnStatus(publicId: string): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`${this.baseUrl}/${publicId}/lhdn-status`);
  }

  cancelInvoice(publicId: string, reason: string): Observable<ApiResponse<Invoice>> {
    return this.http.patch<ApiResponse<Invoice>>(`${this.baseUrl}/${publicId}/cancel`, { reason });
  }

  // ─── Payments ──────────────────────────────────────────────

  getPayments(publicId: string): Observable<ApiResponse<InvoicePayment[]>> {
    return this.http.get<ApiResponse<InvoicePayment[]>>(`${this.baseUrl}/${publicId}/payments`);
  }

  recordPayment(publicId: string, payment: Partial<InvoicePayment>): Observable<ApiResponse<InvoicePayment>> {
    return this.http.post<ApiResponse<InvoicePayment>>(`${this.baseUrl}/${publicId}/payments`, payment);
  }

  deletePayment(publicId: string, paymentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${publicId}/payments/${paymentId}`);
  }

  // ─── PDF ───────────────────────────────────────────────────

  downloadPdf(publicId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${publicId}/pdf`, { responseType: 'blob' });
  }

  // ─── Generation & Utilities ────────────────────────────────

  getAnalytics(): Observable<ApiResponse<InvoiceAnalytics>> {
    return this.http.get<ApiResponse<InvoiceAnalytics>>(`${this.baseUrl}/analytics`);
  }

  generateFromPayroll(payrollPublicId: string): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(`${this.baseUrl}/generate/payroll`, { payroll_id: payrollPublicId });
  }

  generateFromClaim(claimPublicId: string): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(`${this.baseUrl}/generate/claim`, { claim_id: claimPublicId });
  }

  bulkSubmit(invoiceIds: string[]): Observable<ApiResponse<BulkSubmitResult>> {
    return this.http.post<ApiResponse<BulkSubmitResult>>(`${this.baseUrl}/bulk-submit`, { invoice_ids: invoiceIds });
  }

  validateTin(tin: string): Observable<ApiResponse<TinValidationResult>> {
    return this.http.post<ApiResponse<TinValidationResult>>(`${this.baseUrl}/validate-tin`, { tin });
  }
}
