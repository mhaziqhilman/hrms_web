import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { AnalyticsService } from '../../services/analytics.service';
import {
  PayrollCostAnalytics,
  LeaveUtilizationAnalytics,
  AttendancePunctualityAnalytics,
  ClaimsSpendingAnalytics,
  AnalyticsType,
  MONTH_NAMES
} from '../../models/analytics.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardIcon } from '@/shared/components/icon/icons';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

// Chart Components
import { PayrollCostChartComponent } from '../payroll-cost-chart/payroll-cost-chart.component';
import { LeaveUtilizationChartComponent } from '../leave-utilization-chart/leave-utilization-chart.component';
import { AttendanceAnalyticsChartComponent } from '../attendance-analytics-chart/attendance-analytics-chart.component';
import { ClaimsSpendingChartComponent } from '../claims-spending-chart/claims-spending-chart.component';

type TabType = 'payroll' | 'leave' | 'attendance' | 'claims';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    PayrollCostChartComponent,
    LeaveUtilizationChartComponent,
    AttendanceAnalyticsChartComponent,
    ClaimsSpendingChartComponent
  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ],
  templateUrl: './analytics-dashboard.component.html'
})
export class AnalyticsDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private alertDialogService = inject(ZardAlertDialogService);

  // State
  loading = signal(false);
  activeTab = signal<TabType>('payroll');
  selectedYear = signal<number>(new Date().getFullYear());
  selectedMonth = signal<number | null>(null);

  // Data
  payrollData = signal<PayrollCostAnalytics | null>(null);
  leaveData = signal<LeaveUtilizationAnalytics | null>(null);
  attendanceData = signal<AttendancePunctualityAnalytics | null>(null);
  claimsData = signal<ClaimsSpendingAnalytics | null>(null);

  // Options
  years: number[] = [];
  months = MONTH_NAMES.map((name, index) => ({ value: index + 1, label: name }));

  tabs: { id: TabType; label: string; icon: ZardIcon }[] = [
    { id: 'payroll', label: 'Payroll Cost', icon: 'dollar-sign' },
    { id: 'leave', label: 'Leave Utilization', icon: 'calendar' },
    { id: 'attendance', label: 'Attendance', icon: 'clock' },
    { id: 'claims', label: 'Claims Spending', icon: 'receipt-text' }
  ];

  ngOnInit(): void {
    // Generate year options (current year and 4 years back)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.years.push(currentYear - i);
    }

    this.loadData();
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.loadData();
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadData();
  }

  onMonthChange(month: number | null): void {
    this.selectedMonth.set(month);
    if (this.activeTab() === 'attendance') {
      this.loadData();
    }
  }

  loadData(): void {
    const year = this.selectedYear();
    const tab = this.activeTab();

    this.loading.set(true);

    switch (tab) {
      case 'payroll':
        this.analyticsService.getPayrollCostAnalytics(year).subscribe({
          next: (response) => {
            if (response.success) {
              this.payrollData.set(response.data);
            }
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.showError('Failed to load payroll analytics');
          }
        });
        break;

      case 'leave':
        this.analyticsService.getLeaveUtilizationAnalytics(year).subscribe({
          next: (response) => {
            if (response.success) {
              this.leaveData.set(response.data);
            }
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.showError('Failed to load leave analytics');
          }
        });
        break;

      case 'attendance':
        const month = this.selectedMonth();
        this.analyticsService.getAttendancePunctualityAnalytics(year, month || undefined).subscribe({
          next: (response) => {
            if (response.success) {
              this.attendanceData.set(response.data);
            }
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.showError('Failed to load attendance analytics');
          }
        });
        break;

      case 'claims':
        this.analyticsService.getClaimsSpendingAnalytics(year).subscribe({
          next: (response) => {
            if (response.success) {
              this.claimsData.set(response.data);
            }
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.showError('Failed to load claims analytics');
          }
        });
        break;
    }
  }

  exportExcel(): void {
    const type = this.activeTab() as AnalyticsType;
    const year = this.selectedYear();
    const month = this.activeTab() === 'attendance' ? this.selectedMonth() : undefined;

    this.loading.set(true);

    this.analyticsService.exportExcel(type, year, month || undefined).subscribe({
      next: (blob) => {
        const filename = this.getExportFilename(type, year, month, 'xlsx');
        this.analyticsService.downloadFile(blob, filename);
        this.loading.set(false);
        this.alertDialogService.info({
          zTitle: 'Export Complete',
          zDescription: `${filename} has been downloaded.`,
          zOkText: 'OK'
        });
      },
      error: () => {
        this.loading.set(false);
        this.showError('Failed to export Excel file');
      }
    });
  }

  exportPdf(): void {
    const type = this.activeTab() as AnalyticsType;
    const year = this.selectedYear();
    const month = this.activeTab() === 'attendance' ? this.selectedMonth() : undefined;

    this.loading.set(true);

    this.analyticsService.exportPdf(type, year, month || undefined).subscribe({
      next: (blob) => {
        const filename = this.getExportFilename(type, year, month, 'pdf');
        this.analyticsService.downloadFile(blob, filename);
        this.loading.set(false);
        this.alertDialogService.info({
          zTitle: 'Export Complete',
          zDescription: `${filename} has been downloaded.`,
          zOkText: 'OK'
        });
      },
      error: () => {
        this.loading.set(false);
        this.showError('Failed to export PDF file');
      }
    });
  }

  private getExportFilename(type: string, year: number, month: number | null | undefined, ext: string): string {
    const typeNames: { [key: string]: string } = {
      payroll: 'Payroll_Analytics',
      leave: 'Leave_Analytics',
      attendance: 'Attendance_Analytics',
      claims: 'Claims_Analytics'
    };
    const name = typeNames[type] || type;
    const monthStr = month ? `_${String(month).padStart(2, '0')}` : '';
    return `${name}_${year}${monthStr}.${ext}`;
  }

  private showError(message: string): void {
    this.alertDialogService.warning({
      zTitle: 'Error',
      zDescription: message,
      zOkText: 'OK'
    });
  }

  getTabIcon(tab: TabType): ZardIcon | undefined {
    return this.tabs.find(t => t.id === tab)?.icon;
  }
  
  formatCurrency(amount: number): string {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  }
}
