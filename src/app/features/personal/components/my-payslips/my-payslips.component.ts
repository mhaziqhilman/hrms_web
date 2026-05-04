import { Component, OnInit, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonalService } from '../../services/personal.service';
import { MyPayslip, YTDSummary } from '../../models/personal.model';
import { PayslipPdfService } from '@/features/payroll/services/payslip-pdf.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-my-payslips',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent
  ],
  templateUrl: './my-payslips.component.html',
  styleUrls: ['./my-payslips.component.css']
})
export class MyPayslipsComponent implements OnInit {
  private personalService = inject(PersonalService);
  private payslipPdf = inject(PayslipPdfService);
  private alertDialogService = inject(ZardAlertDialogService);

  // Inputs
  embedded = input(false);

  // State
  loading = signal(false);
  downloading = signal<string | null>(null);
  viewing = signal<string | null>(null);
  payslips = signal<MyPayslip[]>([]);
  ytdSummary = signal<YTDSummary | null>(null);

  // Filters
  selectedYear = signal<number>(new Date().getFullYear());
  years: number[] = [];

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  pageSize = 12;

  ngOnInit(): void {
    // Generate year options (current year and 4 years back)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.years.push(currentYear - i);
    }

    this.loadPayslips();
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.currentPage.set(1);
    this.loadPayslips();
  }

  loadPayslips(): void {
    this.loading.set(true);

    this.personalService.getMyPayslips(
      this.currentPage(),
      this.pageSize,
      this.selectedYear()
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.payslips.set(response.data.payslips);
          this.ytdSummary.set(response.data.ytd_summary);
          if (response.data.pagination) {
            this.totalPages.set(response.data.pagination.totalPages);
            this.totalRecords.set(response.data.pagination.total);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to load payslips',
          zOkText: 'OK'
        });
      }
    });
  }

  async downloadPayslip(payslip: MyPayslip): Promise<void> {
    this.downloading.set(payslip.public_id);
    try {
      const { blob, fileName } = await this.payslipPdf.generateForPayrollId(payslip.public_id);
      this.downloadFile(blob, fileName);
    } catch {
      this.alertDialogService.warning({
        zTitle: 'Error',
        zDescription: 'Failed to download payslip',
        zOkText: 'OK'
      });
    } finally {
      this.downloading.set(null);
    }
  }

  async viewPayslip(payslip: MyPayslip): Promise<void> {
    this.viewing.set(payslip.public_id);
    try {
      const { blob } = await this.payslipPdf.generateForPayrollId(payslip.public_id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      this.alertDialogService.warning({
        zTitle: 'Error',
        zDescription: 'Failed to open payslip',
        zOkText: 'OK'
      });
    } finally {
      this.viewing.set(null);
    }
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPayslips();
    }
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  }

  formatCurrency(amount: number | string | null | undefined): string {
    return `RM ${this.formatNumber(amount)}`;
  }

  formatNumber(amount: number | string | null | undefined): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const safe = num == null || isNaN(num as number) ? 0 : (num as number);
    return safe.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatShortDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'approved':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }

  getStatusPillClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default:
        return 'bg-muted text-foreground';
    }
  }

  getShowingTo(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalRecords());
  }
}
