import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  PayrollCostAnalyticsResponse,
  LeaveUtilizationAnalyticsResponse,
  AttendancePunctualityAnalyticsResponse,
  ClaimsSpendingAnalyticsResponse,
  DashboardSummaryResponse,
  AnalyticsType
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  /**
   * Get payroll cost analytics
   */
  getPayrollCostAnalytics(
    year: number,
    startMonth?: number,
    endMonth?: number
  ): Observable<PayrollCostAnalyticsResponse> {
    let params = new HttpParams().set('year', year.toString());

    if (startMonth) {
      params = params.set('start_month', startMonth.toString());
    }
    if (endMonth) {
      params = params.set('end_month', endMonth.toString());
    }

    return this.http.get<PayrollCostAnalyticsResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.analytics.payrollCost}`,
      { params }
    );
  }

  /**
   * Get leave utilization analytics
   */
  getLeaveUtilizationAnalytics(year: number): Observable<LeaveUtilizationAnalyticsResponse> {
    const params = new HttpParams().set('year', year.toString());

    return this.http.get<LeaveUtilizationAnalyticsResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.analytics.leaveUtilization}`,
      { params }
    );
  }

  /**
   * Get attendance punctuality analytics
   */
  getAttendancePunctualityAnalytics(
    year: number,
    month?: number
  ): Observable<AttendancePunctualityAnalyticsResponse> {
    let params = new HttpParams().set('year', year.toString());

    if (month) {
      params = params.set('month', month.toString());
    }

    return this.http.get<AttendancePunctualityAnalyticsResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.analytics.attendancePunctuality}`,
      { params }
    );
  }

  /**
   * Get claims spending analytics
   */
  getClaimsSpendingAnalytics(year: number): Observable<ClaimsSpendingAnalyticsResponse> {
    const params = new HttpParams().set('year', year.toString());

    return this.http.get<ClaimsSpendingAnalyticsResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.analytics.claimsSpending}`,
      { params }
    );
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(year: number, month: number): Observable<DashboardSummaryResponse> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<DashboardSummaryResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.analytics.dashboard}`,
      { params }
    );
  }

  /**
   * Export analytics as Excel
   */
  exportExcel(type: AnalyticsType, year: number, month?: number): Observable<Blob> {
    let params = new HttpParams()
      .set('type', type)
      .set('year', year.toString());

    if (month) {
      params = params.set('month', month.toString());
    }

    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.analytics.exportExcel}`,
      { params, responseType: 'blob' }
    );
  }

  /**
   * Export analytics as PDF
   */
  exportPdf(type: AnalyticsType, year: number, month?: number): Observable<Blob> {
    let params = new HttpParams()
      .set('type', type)
      .set('year', year.toString());

    if (month) {
      params = params.set('month', month.toString());
    }

    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.analytics.exportPdf}`,
      { params, responseType: 'blob' }
    );
  }

  /**
   * Helper to trigger file download
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
