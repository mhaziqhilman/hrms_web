import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  AvailablePeriodsResponse,
  EAEmployeesResponse,
  EAFormResponse,
  EPFBorangAResponse,
  SOCSOForm8AResponse,
  PCBCP39Response
} from '../models/statutory-reports.model';

@Injectable({
  providedIn: 'root'
})
export class StatutoryReportsService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  /**
   * Get available report periods (years and months with data)
   */
  getAvailablePeriods(): Observable<AvailablePeriodsResponse> {
    return this.http.get<AvailablePeriodsResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.periods}`
    );
  }

  // ============ EA Form ============

  /**
   * Get employees list for EA form selection
   */
  getEAEmployees(year: number): Observable<EAEmployeesResponse> {
    return this.http.get<EAEmployeesResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.eaEmployees(year)}`
    );
  }

  /**
   * Get EA Form data for an employee
   */
  getEAForm(employeeId: number, year: number): Observable<EAFormResponse> {
    return this.http.get<EAFormResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.ea(employeeId, year)}`
    );
  }

  /**
   * Download EA Form as PDF
   */
  downloadEAFormPDF(employeeId: number, year: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.eaPdf(employeeId, year)}`,
      { responseType: 'blob' }
    );
  }

  // ============ EPF Borang A ============

  /**
   * Get EPF Borang A data
   */
  getEPFBorangA(year: number, month: number): Observable<EPFBorangAResponse> {
    return this.http.get<EPFBorangAResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.epf(year, month)}`
    );
  }

  /**
   * Download EPF Borang A as PDF
   */
  downloadEPFBorangAPDF(year: number, month: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.epfPdf(year, month)}`,
      { responseType: 'blob' }
    );
  }

  // ============ SOCSO Form 8A ============

  /**
   * Get SOCSO Form 8A data
   */
  getSOCSOForm8A(year: number, month: number): Observable<SOCSOForm8AResponse> {
    return this.http.get<SOCSOForm8AResponse>(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.socso(year, month)}`
    );
  }

  /**
   * Download SOCSO Form 8A as PDF
   */
  downloadSOCSOForm8APDF(year: number, month: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.socsoPdf(year, month)}`,
      { responseType: 'blob' }
    );
  }

  // ============ PCB CP39 ============

  /**
   * Get PCB CP39 data
   */
  getPCBCP39(year: number, month: number): Observable<PCBCP39Response> {
    return this.http.get<PCBCP39Response>(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.pcb(year, month)}`
    );
  }

  /**
   * Download PCB CP39 as PDF
   */
  downloadPCBCP39PDF(year: number, month: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.pcbPdf(year, month)}`,
      { responseType: 'blob' }
    );
  }

  // ============ CSV Export ============

  /**
   * Download report as CSV
   */
  downloadCSV(type: 'epf' | 'socso' | 'pcb', year: number, month: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${API_CONFIG.endpoints.statutoryReports.csv(type, year, month)}`,
      { responseType: 'blob' }
    );
  }

  // ============ Helper Methods ============

  /**
   * Trigger file download from blob
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
