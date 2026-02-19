import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatutoryReportsService } from '../../services/statutory-reports.service';
import {
  REPORT_TYPES,
  MONTHS,
  ReportType,
  EAEmployee,
  EAFormData,
  EPFBorangAData,
  SOCSOForm8AData,
  PCBCP39Data
} from '../../models/statutory-reports.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardTableComponent } from '@/shared/components/table/table.component';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardTableComponent
  ],
  templateUrl: './reports-list.component.html',
  styleUrl: './reports-list.component.css'
})
export class ReportsListComponent implements OnInit {
  private alertDialogService = inject(ZardAlertDialogService);
  private reportsService = inject(StatutoryReportsService);

  // Constants
  REPORT_TYPES = REPORT_TYPES;
  MONTHS = MONTHS;

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  selectedReportType = signal<ReportType | null>(null);

  // Period selection
  availablePeriods = signal<{ [year: string]: number[] }>({});
  availableYears = signal<number[]>([]);
  selectedYear = signal<number | null>(null);
  selectedMonth = signal<number | null>(null);

  // EA Form specific
  eaEmployees = signal<EAEmployee[]>([]);
  selectedEmployeeId = signal<number | null>(null);

  // Report data
  reportData = signal<any>(null);
  showPreview = signal(false);

  ngOnInit(): void {
    this.loadAvailablePeriods();
  }

  loadAvailablePeriods(): void {
    this.reportsService.getAvailablePeriods().subscribe({
      next: (response) => {
        if (response.success) {
          this.availablePeriods.set(response.data);
          const years = Object.keys(response.data).map(Number).sort((a, b) => b - a);
          this.availableYears.set(years);
          if (years.length > 0) {
            this.selectedYear.set(years[0]);
          }
        }
      },
      error: (err) => {
        console.error('Error loading periods:', err);
      }
    });
  }

  selectReportType(type: ReportType): void {
    this.selectedReportType.set(type);
    this.reportData.set(null);
    this.showPreview.set(false);

    if (type === 'ea' && this.selectedYear()) {
      this.loadEAEmployees();
    }
  }

  onYearChange(): void {
    this.selectedMonth.set(null);
    this.reportData.set(null);
    this.showPreview.set(false);

    if (this.selectedReportType() === 'ea' && this.selectedYear()) {
      this.loadEAEmployees();
    }
  }

  onMonthChange(): void {
    this.reportData.set(null);
    this.showPreview.set(false);
  }

  getAvailableMonths(): number[] {
    const year = this.selectedYear();
    if (!year) return [];
    const periods = this.availablePeriods();
    return periods[year.toString()] || [];
  }

  getMonthName(month: number): string {
    const m = MONTHS.find(m => m.value === month);
    return m ? m.label : '';
  }

  loadEAEmployees(): void {
    const year = this.selectedYear();
    if (!year) return;

    this.reportsService.getEAEmployees(year).subscribe({
      next: (response) => {
        if (response.success) {
          this.eaEmployees.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error loading employees:', err);
      }
    });
  }

  canGenerateReport(): boolean {
    const type = this.selectedReportType();
    const year = this.selectedYear();

    if (!type || !year) return false;

    if (type === 'ea') {
      return !!this.selectedEmployeeId();
    } else {
      return !!this.selectedMonth();
    }
  }

  generateReport(): void {
    const type = this.selectedReportType();
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const employeeId = this.selectedEmployeeId();

    if (!type || !year) return;

    this.loading.set(true);
    this.error.set(null);

    switch (type) {
      case 'ea':
        if (!employeeId) return;
        this.reportsService.getEAForm(employeeId, year).subscribe({
          next: (response) => {
            if (response.success) {
              this.reportData.set(response.data);
              this.showPreview.set(true);
            }
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to generate EA Form');
            this.loading.set(false);
          }
        });
        break;

      case 'epf':
        if (!month) return;
        this.reportsService.getEPFBorangA(year, month).subscribe({
          next: (response) => {
            if (response.success) {
              this.reportData.set(response.data);
              this.showPreview.set(true);
            }
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to generate EPF Borang A');
            this.loading.set(false);
          }
        });
        break;

      case 'socso':
        if (!month) return;
        this.reportsService.getSOCSOForm8A(year, month).subscribe({
          next: (response) => {
            if (response.success) {
              this.reportData.set(response.data);
              this.showPreview.set(true);
            }
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to generate SOCSO Form 8A');
            this.loading.set(false);
          }
        });
        break;

      case 'pcb':
        if (!month) return;
        this.reportsService.getPCBCP39(year, month).subscribe({
          next: (response) => {
            if (response.success) {
              this.reportData.set(response.data);
              this.showPreview.set(true);
            }
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to generate PCB CP39');
            this.loading.set(false);
          }
        });
        break;
    }
  }

  downloadPDF(): void {
    const type = this.selectedReportType();
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const employeeId = this.selectedEmployeeId();

    if (!type || !year) return;

    this.loading.set(true);

    let download$;
    let filename = '';

    switch (type) {
      case 'ea':
        if (!employeeId) return;
        download$ = this.reportsService.downloadEAFormPDF(employeeId, year);
        const employee = this.eaEmployees().find(e => e.id === employeeId);
        filename = `EA_Form_${employee?.employee_id || employeeId}_${year}.pdf`;
        break;

      case 'epf':
        if (!month) return;
        download$ = this.reportsService.downloadEPFBorangAPDF(year, month);
        filename = `EPF_Borang_A_${year}_${String(month).padStart(2, '0')}.pdf`;
        break;

      case 'socso':
        if (!month) return;
        download$ = this.reportsService.downloadSOCSOForm8APDF(year, month);
        filename = `SOCSO_Form_8A_${year}_${String(month).padStart(2, '0')}.pdf`;
        break;

      case 'pcb':
        if (!month) return;
        download$ = this.reportsService.downloadPCBCP39PDF(year, month);
        filename = `PCB_CP39_${year}_${String(month).padStart(2, '0')}.pdf`;
        break;

      default:
        return;
    }

    download$.subscribe({
      next: (blob) => {
        this.reportsService.downloadFile(blob, filename);
        this.loading.set(false);
        this.alertDialogService.info({
          zTitle: 'Download Complete',
          zDescription: `${filename} has been downloaded.`,
          zOkText: 'OK'
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.alertDialogService.warning({
          zTitle: 'Download Failed',
          zDescription: 'Failed to download the report. Please try again.',
          zOkText: 'OK'
        });
      }
    });
  }

  downloadExcel(): void {
    const type = this.selectedReportType();
    const year = this.selectedYear();
    const employeeId = this.selectedEmployeeId();

    if (type !== 'ea' || !year || !employeeId) return;

    this.loading.set(true);

    const employee = this.eaEmployees().find(e => e.id === employeeId);
    const filename = `EA_Form_${employee?.employee_id || employeeId}_${year}.xlsx`;

    this.reportsService.downloadEAFormExcel(employeeId, year).subscribe({
      next: (blob) => {
        this.reportsService.downloadFile(blob, filename);
        this.loading.set(false);
        this.alertDialogService.info({
          zTitle: 'Download Complete',
          zDescription: `${filename} has been downloaded.`,
          zOkText: 'OK'
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.alertDialogService.warning({
          zTitle: 'Download Failed',
          zDescription: 'Failed to download the Excel report. Please try again.',
          zOkText: 'OK'
        });
      }
    });
  }

  downloadCSV(): void {
    const type = this.selectedReportType();
    const year = this.selectedYear();
    const month = this.selectedMonth();

    if (!type || !year || !month || type === 'ea') return;

    this.loading.set(true);

    const filename = `${type.toUpperCase()}_${year}_${String(month).padStart(2, '0')}.csv`;

    this.reportsService.downloadCSV(type as 'epf' | 'socso' | 'pcb', year, month).subscribe({
      next: (blob) => {
        this.reportsService.downloadFile(blob, filename);
        this.loading.set(false);
        this.alertDialogService.info({
          zTitle: 'Download Complete',
          zDescription: `${filename} has been downloaded.`,
          zOkText: 'OK'
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.alertDialogService.warning({
          zTitle: 'Download Failed',
          zDescription: 'Failed to download the CSV. Please try again.',
          zOkText: 'OK'
        });
      }
    });
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return 'RM 0.00';
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  backToSelection(): void {
    this.selectedReportType.set(null);
    this.reportData.set(null);
    this.showPreview.set(false);
    this.selectedEmployeeId.set(null);
  }

  getSelectedReportName(): string {
    const type = this.selectedReportType();
    if (!type) return '';
    const report = REPORT_TYPES.find(r => r.id === type);
    return report?.name || '';
  }

  onYearSelect(value: number): void {
    this.selectedYear.set(value);
    this.onYearChange();
  }

  onMonthSelect(value: number): void {
    this.selectedMonth.set(value);
    this.onMonthChange();
  }

  onEmployeeSelect(value: number): void {
    this.selectedEmployeeId.set(value);
  }
}
