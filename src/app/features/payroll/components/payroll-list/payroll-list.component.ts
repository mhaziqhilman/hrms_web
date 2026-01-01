import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../services/payroll.service';
import { Payroll, PayrollStatus, MONTH_NAMES, PAYROLL_STATUS_COLORS } from '../../models/payroll.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardTableComponent } from '@/shared/components/table/table.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardTooltipModule,
    ZardTableComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent
  ],
  templateUrl: './payroll-list.component.html',
  styleUrl: './payroll-list.component.css'
})
export class PayrollListComponent implements OnInit {
  payrolls = signal<Payroll[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  limit = 10;
  total = signal(0);

  // Filters
  selectedStatus = signal<PayrollStatus | ''>('');
  selectedYear = signal<number>(new Date().getFullYear());
  selectedMonth = signal<number | ''>(new Date().getMonth() + 1);
  searchEmployeeId = signal<string>('');

  // Constants
  PayrollStatus = PayrollStatus;
  MONTH_NAMES = MONTH_NAMES;
  PAYROLL_STATUS_COLORS = PAYROLL_STATUS_COLORS;
  Math = Math;

  // Generate year options (last 3 years)
  years: number[] = [];

  constructor(private payrollService: PayrollService) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 3; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit(): void {
    this.loadPayrolls();
  }

  loadPayrolls(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: any = {
      page: this.currentPage(),
      limit: this.limit
    };

    if (this.selectedStatus()) {
      params.status = this.selectedStatus();
    }
    if (this.selectedYear()) {
      params.year = this.selectedYear();
    }
    if (this.selectedMonth()) {
      params.month = this.selectedMonth();
    }

    this.payrollService.getPayrolls(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.payrolls.set(response.data.payrolls);
          this.currentPage.set(response.data.pagination.currentPage);
          this.totalPages.set(response.data.pagination.totalPages);
          this.total.set(response.data.pagination.total);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load payroll records');
        this.loading.set(false);
        console.error('Error loading payrolls:', err);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadPayrolls();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPayrolls();
  }

  clearFilters(): void {
    this.selectedStatus.set('');
    this.selectedYear.set(new Date().getFullYear());
    this.selectedMonth.set(new Date().getMonth() + 1);
    this.searchEmployeeId.set('');
    this.currentPage.set(1);
    this.loadPayrolls();
  }

  getStatusBadgeClass(status: PayrollStatus): string {
    return `badge bg-${PAYROLL_STATUS_COLORS[status]}`;
  }

  getStatusBadgeVariant(status: PayrollStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<PayrollStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [PayrollStatus.DRAFT]: 'secondary',
      [PayrollStatus.PENDING]: 'outline',
      [PayrollStatus.APPROVED]: 'default',
      [PayrollStatus.PAID]: 'default',
      [PayrollStatus.CANCELLED]: 'destructive'
    };
    return variantMap[status] || 'default';
  }

  getMonthName(month: number): string {
    return MONTH_NAMES[month - 1];
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  approvePayroll(payroll: Payroll): void {
    if (!confirm(`Are you sure you want to approve payroll for ${payroll.employee?.full_name}?`)) {
      return;
    }

    this.payrollService.approvePayroll(payroll.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Payroll approved successfully');
          this.loadPayrolls();
        }
      },
      error: (err) => {
        alert('Failed to approve payroll');
        console.error('Error approving payroll:', err);
      }
    });
  }

  markAsPaid(payroll: Payroll): void {
    if (!confirm(`Are you sure you want to mark this payroll as paid?`)) {
      return;
    }

    this.payrollService.markAsPaid(payroll.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Payroll marked as paid successfully');
          this.loadPayrolls();
        }
      },
      error: (err) => {
        alert('Failed to mark payroll as paid');
        console.error('Error marking payroll as paid:', err);
      }
    });
  }

  cancelPayroll(payroll: Payroll): void {
    if (!confirm(`Are you sure you want to cancel this payroll?`)) {
      return;
    }

    this.payrollService.cancelPayroll(payroll.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Payroll cancelled successfully');
          this.loadPayrolls();
        }
      },
      error: (err) => {
        alert('Failed to cancel payroll');
        console.error('Error cancelling payroll:', err);
      }
    });
  }

  canEdit(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.DRAFT || payroll.status === PayrollStatus.PENDING;
  }

  canApprove(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.PENDING;
  }

  canMarkPaid(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.APPROVED;
  }

  canCancel(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.DRAFT || payroll.status === PayrollStatus.PENDING;
  }
}
