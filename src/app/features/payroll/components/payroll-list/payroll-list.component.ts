import { Component, OnInit, signal, inject } from '@angular/core';
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
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTabGroupComponent, ZardTabComponent } from '@/shared/components/tabs/tabs.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';

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
    ZardFormLabelComponent,
    ZardMenuImports,
    ZardTabGroupComponent,
    ZardTabComponent,
    ZardCheckboxComponent
  ],
  templateUrl: './payroll-list.component.html',
  styleUrl: './payroll-list.component.css'
})
export class PayrollListComponent implements OnInit {
  private alertDialogService = inject(ZardAlertDialogService);

  payrolls = signal<Payroll[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Selection
  selectedPayrolls = signal<Set<number>>(new Set());
  selectAll = false;  // Changed from signal to regular property for ngModel compatibility

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  limit = 10;
  total = signal(0);

  // Tabs for status filtering
  activeTab = signal<PayrollStatus | 'All'>('All');
  statusCounts = signal<Record<string, number>>({
    All: 0,
    Draft: 0,
    Pending: 0,
    Approved: 0,
    Paid: 0,
    Cancelled: 0
  });

  // Filters
  selectedStatus = signal<PayrollStatus | ''>('');
  selectedYear = signal<number | null>(null);
  selectedMonth = signal<number | ''>('');
  searchEmployeeId = signal<string>('');

  // Column visibility
  visibleColumns = signal<Record<string, boolean>>({
    employee: true,
    period: true,
    basicSalary: true,
    grossSalary: true,
    deductions: true,
    netSalary: true,
    status: true
  });

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

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
    this.loadStatusCounts();
  }

  loadStatusCounts(): void {
    // Load counts for each status from backend
    const counts = {
      All: 0,
      Draft: 0,
      Pending: 0,
      Approved: 0,
      Paid: 0,
      Cancelled: 0
    };

    // Get total count (All)
    this.payrollService.getPayrolls({ limit: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.All = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    // Get Draft count
    this.payrollService.getPayrolls({ status: PayrollStatus.DRAFT, limit: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Draft = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    // Get Pending count
    this.payrollService.getPayrolls({ status: PayrollStatus.PENDING, limit: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Pending = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    // Get Approved count
    this.payrollService.getPayrolls({ status: PayrollStatus.APPROVED, limit: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Approved = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    // Get Paid count
    this.payrollService.getPayrolls({ status: PayrollStatus.PAID, limit: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Paid = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    // Get Cancelled count
    this.payrollService.getPayrolls({ status: PayrollStatus.CANCELLED, limit: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Cancelled = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });
  }

  onTabChange(event: { index: number; label: string }): void {
    // Map index to status
    const statusMap: Array<PayrollStatus | 'All'> = [
      'All',
      PayrollStatus.DRAFT,
      PayrollStatus.PENDING,
      PayrollStatus.APPROVED,
      PayrollStatus.PAID,
      PayrollStatus.CANCELLED
    ];

    const tab = statusMap[event.index];
    this.activeTab.set(tab);
    this.selectedStatus.set(tab === 'All' ? '' : tab);
    this.currentPage.set(1);
    this.clearSelection();

    // Clear all filters when switching to "All Request" tab
    if (tab === 'All') {
      this.selectedYear.set(null);
      this.selectedMonth.set('');
    }

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
    const searchValue = this.searchEmployeeId();
    if (searchValue && searchValue.trim() !== '') {
      params.search = searchValue;
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
    this.selectedYear.set(null);
    this.selectedMonth.set('');
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

  getSelectedMonthName(): string {
    const month = this.selectedMonth();
    return typeof month === 'number' ? MONTH_NAMES[month - 1] : 'Month';
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  submitForApproval(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Submit for Approval',
      zDescription: `Are you sure you want to submit payroll for ${payroll.employee?.full_name} for approval?`,
      zOkText: 'Submit',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.payrollService.submitForApproval(payroll.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll submitted for approval successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to submit payroll for approval',
              zOkText: 'OK'
            });
            console.error('Error submitting payroll:', err);
          }
        });
      }
    });
  }

  approvePayroll(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Approve Payroll',
      zDescription: `Are you sure you want to approve payroll for ${payroll.employee?.full_name}?`,
      zOkText: 'Approve',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.payrollService.approvePayroll(payroll.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll approved successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to approve payroll',
              zOkText: 'OK'
            });
            console.error('Error approving payroll:', err);
          }
        });
      }
    });
  }

  markAsPaid(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Mark as Paid',
      zDescription: `Are you sure you want to mark this payroll as paid for ${payroll.employee?.full_name}?`,
      zOkText: 'Mark as Paid',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.payrollService.markAsPaid(payroll.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll marked as paid successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to mark payroll as paid',
              zOkText: 'OK'
            });
            console.error('Error marking payroll as paid:', err);
          }
        });
      }
    });
  }

  cancelPayroll(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Cancel Payroll',
      zDescription: `Are you sure you want to cancel this payroll for ${payroll.employee?.full_name}? This action cannot be undone.`,
      zOkText: 'Cancel Payroll',
      zCancelText: 'Go Back',
      zOkDestructive: true,
      zOnOk: () => {
        this.payrollService.cancelPayroll(payroll.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll cancelled successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to cancel payroll',
              zOkText: 'OK'
            });
            console.error('Error cancelling payroll:', err);
          }
        });
      }
    });
  }

  canEdit(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.DRAFT;
  }

  canSubmit(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.DRAFT;
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

  // Checkbox selection methods
  toggleSelectAll(): void {
    if (this.selectAll) {
      // Select all payrolls on current page
      const newSelected = new Set(this.payrolls().map(p => p.id));
      this.selectedPayrolls.set(newSelected);
    } else {
      // Deselect all
      this.selectedPayrolls.set(new Set());
      this.selectAll = false;
    }
  }

  togglePayrollSelection(payrollId: number): void {
    const selected = new Set(this.selectedPayrolls());

    if (selected.has(payrollId)) {
      selected.delete(payrollId);
    } else {
      selected.add(payrollId);
    }

    this.selectedPayrolls.set(selected);

    // Update select all checkbox state
    this.selectAll = selected.size === this.payrolls().length && this.payrolls().length > 0;
  }

  isPayrollSelected(payrollId: number): boolean {
    return this.selectedPayrolls().has(payrollId);
  }

  getSelectedCount(): number {
    return this.selectedPayrolls().size;
  }

  clearSelection(): void {
    this.selectedPayrolls.set(new Set());
    this.selectAll = false;
  }

  bulkApprove(): void {
    const selected = Array.from(this.selectedPayrolls());
    if (selected.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No Selection',
        zDescription: 'Please select payrolls to approve',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Bulk Approve',
      zDescription: `Are you sure you want to approve ${selected.length} payroll record(s)?`,
      zOkText: 'Approve All',
      zCancelText: 'Cancel',
      zOnOk: () => {
        // TODO: Implement bulk approve API call
        console.log('Bulk approve:', selected);
        this.alertDialogService.info({
          zTitle: 'Information',
          zDescription: 'Bulk approve functionality to be implemented',
          zOkText: 'OK'
        });
      }
    });
  }

  bulkDelete(): void {
    const selected = Array.from(this.selectedPayrolls());
    if (selected.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No Selection',
        zDescription: 'Please select payrolls to delete',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Bulk Delete',
      zDescription: `Are you sure you want to delete ${selected.length} payroll record(s)? This action cannot be undone.`,
      zOkText: 'Delete All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        // TODO: Implement bulk delete API call
        console.log('Bulk delete:', selected);
        this.alertDialogService.info({
          zTitle: 'Information',
          zDescription: 'Bulk delete functionality to be implemented',
          zOkText: 'OK'
        });
      }
    });
  }

  toggleColumn(column: string): void {
    const columns = { ...this.visibleColumns() };
    columns[column] = !columns[column];
    this.visibleColumns.set(columns);
  }

  // Sorting methods
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      // Toggle direction if same column
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortPayrolls();
  }

  sortPayrolls(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return;

    const sorted = [...this.payrolls()].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'employee':
          aValue = a.employee?.full_name?.toLowerCase() || '';
          bValue = b.employee?.full_name?.toLowerCase() || '';
          break;
        case 'period':
          aValue = a.year * 12 + a.month;
          bValue = b.year * 12 + b.month;
          break;
        case 'basicSalary':
          aValue = parseFloat(a.basic_salary?.toString() || '0');
          bValue = parseFloat(b.basic_salary?.toString() || '0');
          break;
        case 'grossSalary':
          aValue = parseFloat(a.gross_salary?.toString() || '0');
          bValue = parseFloat(b.gross_salary?.toString() || '0');
          break;
        case 'deductions':
          aValue = parseFloat(a.total_deductions?.toString() || '0');
          bValue = parseFloat(b.total_deductions?.toString() || '0');
          break;
        case 'netSalary':
          aValue = parseFloat(a.net_salary?.toString() || '0');
          bValue = parseFloat(b.net_salary?.toString() || '0');
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.payrolls.set(sorted);
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn() === column;
  }
}
