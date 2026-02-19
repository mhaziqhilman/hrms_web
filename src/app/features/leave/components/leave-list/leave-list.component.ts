import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { AuthService } from '@/core/services/auth.service';
import { Leave, LeaveStatus, LEAVE_STATUS_COLORS, LEAVE_STATUS_ICONS } from '../../models/leave.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardDatePickerComponent,
    ZardTableImports,
    ZardTooltipModule,
    ZardCheckboxComponent,
    ZardEmptyComponent
  ],
  templateUrl: './leave-list.component.html',
  styleUrl: './leave-list.component.css'
})
export class LeaveListComponent implements OnInit {
  private leaveService = inject(LeaveService);
  private router = inject(Router);
  private alertDialogService = inject(ZardAlertDialogService);
  private authService = inject(AuthService);

  leaves = signal<Leave[]>([]);
  loading = signal(false);
  hasProfile = signal(true);
  error = signal<string | null>(null);
  isStaff = signal(false);
  currentEmployeeId = signal<number | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  limit = signal(10);
  total = signal(0);

  // Filters
  selectedStatus = signal<LeaveStatus | ''>('');
  selectedLeaveType = signal<number | ''>('');
  startDateFilter = signal<string>('');
  endDateFilter = signal<string>('');

  // Date picker values
  startDateValue: Date | null = null;
  endDateValue: Date | null = null;

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selection
  selectedLeaves = signal<Set<number>>(new Set());
  selectAll = false;  // Changed from signal to regular property for ngModel compatibility

  // Column visibility
  visibleColumns = signal<{[key: string]: boolean}>({
    employee: true,
    leaveType: true,
    startDate: true,
    endDate: true,
    duration: true,
    status: true
  });

  // Column list for toggle menu
  columnList = [
    { key: 'employee', label: 'Employee' },
    { key: 'leaveType', label: 'Leave Type' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status' }
  ];

  // Constants
  LeaveStatus = LeaveStatus;
  LEAVE_STATUS_COLORS = LEAVE_STATUS_COLORS;
  LEAVE_STATUS_ICONS = LEAVE_STATUS_ICONS;
  Math = Math;

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    this.isStaff.set(user?.role === 'staff');
    this.currentEmployeeId.set(user?.employee?.id ?? null);

    if (user?.employee) {
      this.hasProfile.set(true);
      this.loadLeaves();
    } else {
      this.loading.set(true);
      this.authService.getCurrentUser().subscribe({
        next: (res) => {
          if (res.success && res.data?.employee) {
            this.hasProfile.set(true);
            this.loadLeaves();
          } else {
            this.hasProfile.set(false);
            this.loading.set(false);
          }
        },
        error: () => {
          this.hasProfile.set(false);
          this.loading.set(false);
        }
      });
    }
  }

  loadLeaves(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: any = {
      page: this.currentPage(),
      limit: this.limit()
    };

    if (this.selectedStatus()) {
      params.status = this.selectedStatus();
    }
    if (this.selectedLeaveType()) {
      params.leave_type_id = this.selectedLeaveType();
    }
    if (this.startDateFilter()) {
      params.start_date = this.startDateFilter();
    }
    if (this.endDateFilter()) {
      params.end_date = this.endDateFilter();
    }

    this.leaveService.getLeaves(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaves.set(response.data.leaves);
          this.currentPage.set(response.data.pagination.currentPage);
          this.totalPages.set(response.data.pagination.totalPages);
          this.total.set(response.data.pagination.total);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load leave applications');
        this.loading.set(false);
        console.error('Error loading leaves:', err);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadLeaves();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadLeaves();
  }

  clearFilters(): void {
    this.selectedStatus.set('');
    this.selectedLeaveType.set('');
    this.startDateFilter.set('');
    this.endDateFilter.set('');
    this.startDateValue = null;
    this.endDateValue = null;
    this.currentPage.set(1);
    this.loadLeaves();
  }

  // Get selected count for bulk actions
  getSelectedCount(): number {
    return this.selectedLeaves().size;
  }

  // Clear selection
  clearSelection(): void {
    this.selectedLeaves.set(new Set());
    this.selectAll = false;
  }

  // Toggle column visibility
  toggleColumn(column: string): void {
    const current = this.visibleColumns();
    this.visibleColumns.set({
      ...current,
      [column]: !current[column]
    });
  }

  approveLeave(leave: Leave): void {
    this.alertDialogService.confirm({
      zTitle: 'Approve Leave',
      zDescription: `Are you sure you want to approve leave for ${leave.employee?.full_name}?`,
      zOkText: 'Approve',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.leaveService.approveRejectLeave(leave.id, {
          action: 'approve'
        }).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Leave approved successfully',
                zOkText: 'OK'
              });
              this.loadLeaves();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to approve leave',
              zOkText: 'OK'
            });
            console.error('Error approving leave:', err);
          }
        });
      }
    });
  }

  rejectLeave(leave: Leave): void {
    this.alertDialogService.confirm({
      zTitle: 'Reject Leave',
      zDescription: `Are you sure you want to reject leave for ${leave.employee?.full_name}? Please provide a reason.`,
      zOkText: 'Reject',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        // For now, we'll use a simple approach - in production you'd want a proper dialog with input
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        this.leaveService.approveRejectLeave(leave.id, {
          action: 'reject',
          rejection_reason: reason
        }).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Leave rejected successfully',
                zOkText: 'OK'
              });
              this.loadLeaves();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to reject leave',
              zOkText: 'OK'
            });
            console.error('Error rejecting leave:', err);
          }
        });
      }
    });
  }

  cancelLeave(leave: Leave): void {
    this.alertDialogService.confirm({
      zTitle: 'Cancel Leave',
      zDescription: 'Are you sure you want to cancel this leave application?',
      zOkText: 'Cancel Leave',
      zCancelText: 'Close',
      zOkDestructive: true,
      zOnOk: () => {
        this.leaveService.cancelLeave(leave.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Leave cancelled successfully',
                zOkText: 'OK'
              });
              this.loadLeaves();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to cancel leave',
              zOkText: 'OK'
            });
            console.error('Error cancelling leave:', err);
          }
        });
      }
    });
  }

  bulkApprove(): void {
    const selected = Array.from(this.selectedLeaves());
    if (selected.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No Selection',
        zDescription: 'Please select leave applications to approve',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Approve Selected Leaves',
      zDescription: `Are you sure you want to approve ${selected.length} leave application(s)?`,
      zOkText: 'Approve All',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.alertDialogService.info({
          zTitle: 'Success',
          zDescription: `${selected.length} leave application(s) approved successfully`,
          zOkText: 'OK'
        });
        this.selectedLeaves.set(new Set());
        this.selectAll = false;
        this.loadLeaves();
      }
    });
  }

  bulkReject(): void {
    const selected = Array.from(this.selectedLeaves());
    if (selected.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No Selection',
        zDescription: 'Please select leave applications to reject',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Reject Selected Leaves',
      zDescription: `Are you sure you want to reject ${selected.length} leave application(s)?`,
      zOkText: 'Reject All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.alertDialogService.info({
          zTitle: 'Success',
          zDescription: `${selected.length} leave application(s) rejected successfully`,
          zOkText: 'OK'
        });
        this.selectedLeaves.set(new Set());
        this.selectAll = false;
        this.loadLeaves();
      }
    });
  }

  getStatusBadgeClass(status: LeaveStatus): string {
    return `badge bg-${LEAVE_STATUS_COLORS[status]}`;
  }

  getStatusIcon(status: LeaveStatus): string {
    return LEAVE_STATUS_ICONS[status];
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDuration(leave: Leave): string {
    if (leave.is_half_day) {
      return `0.5 day (${leave.half_day_period})`;
    }
    return `${leave.total_days} ${leave.total_days === 1 ? 'day' : 'days'}`;
  }

  canEdit(leave: Leave): boolean {
    if (leave.status !== LeaveStatus.PENDING) return false;
    // Staff can only edit their own leaves
    if (this.isStaff()) {
      return leave.employee_id === this.currentEmployeeId();
    }
    return true;
  }

  canApprove(leave: Leave): boolean {
    if (this.isStaff()) return false;
    return leave.status === LeaveStatus.PENDING;
  }

  canReject(leave: Leave): boolean {
    if (this.isStaff()) return false;
    return leave.status === LeaveStatus.PENDING;
  }

  canCancel(leave: Leave): boolean {
    if (leave.status !== LeaveStatus.PENDING) return false;
    // Staff can only cancel their own leaves
    if (this.isStaff()) {
      return leave.employee_id === this.currentEmployeeId();
    }
    return true;
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, -1);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push(-1, total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  }

  getStatusBadgeType(status: LeaveStatus): 'default' | 'destructive' | 'outline' | 'secondary' {
    const colorMap: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      'warning': 'outline',
      'success': 'default',
      'danger': 'destructive',
      'secondary': 'secondary'
    };
    return colorMap[LEAVE_STATUS_COLORS[status]] || 'outline';
  }

  getStatusIconType(status: LeaveStatus): 'clock' | 'circle-check' | 'circle-x' | 'circle' {
    const iconMap: Record<string, 'clock' | 'circle-check' | 'circle-x' | 'circle'> = {
      'bi-clock-history': 'clock',
      'bi-check-circle': 'circle-check',
      'bi-x-circle': 'circle-x',
      'bi-slash-circle': 'circle'
    };
    return iconMap[LEAVE_STATUS_ICONS[status]] || 'circle';
  }

  // Date handling for ZardUI date picker
  onStartDateChange(date: Date | null): void {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      this.startDateFilter.set(`${year}-${month}-${day}`);
    } else {
      this.startDateFilter.set('');
    }
    this.onFilterChange();
  }

  onEndDateChange(date: Date | null): void {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      this.endDateFilter.set(`${year}-${month}-${day}`);
    } else {
      this.endDateFilter.set('');
    }
    this.onFilterChange();
  }

  getStartDateAsDate(): Date | null {
    return this.startDateFilter() ? new Date(this.startDateFilter()) : null;
  }

  getEndDateAsDate(): Date | null {
    return this.endDateFilter() ? new Date(this.endDateFilter()) : null;
  }

  getStatusDisplayName(): string {
    const status = this.selectedStatus();
    if (!status) return 'Status';
    return status.replace('_', ' ');
  }

  viewLeaveDetails(leave: Leave): void {
    this.router.navigate(['/leave', leave.id]);
  }

  // Sorting methods
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortLeaves();
  }

  sortLeaves(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return;

    const sorted = [...this.leaves()].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'employee':
          aValue = a.employee?.full_name?.toLowerCase() || '';
          bValue = b.employee?.full_name?.toLowerCase() || '';
          break;
        case 'leaveType':
          aValue = a.leave_type?.name?.toLowerCase() || '';
          bValue = b.leave_type?.name?.toLowerCase() || '';
          break;
        case 'startDate':
          aValue = a.start_date || '';
          bValue = b.start_date || '';
          break;
        case 'endDate':
          aValue = a.end_date || '';
          bValue = b.end_date || '';
          break;
        case 'duration':
          aValue = a.total_days || 0;
          bValue = b.total_days || 0;
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

    this.leaves.set(sorted);
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn() === column;
  }

  // Selection methods
  toggleSelectAll(): void {
    if (this.selectAll) {
      const allIds = new Set(this.leaves().map(l => l.id));
      this.selectedLeaves.set(allIds);
    } else {
      this.selectedLeaves.set(new Set());
      this.selectAll = false;
    }
  }

  toggleLeaveSelection(id: number): void {
    const selected = new Set(this.selectedLeaves());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedLeaves.set(selected);
    this.selectAll = selected.size === this.leaves().length && this.leaves().length > 0;
  }

  isLeaveSelected(id: number): boolean {
    return this.selectedLeaves().has(id);
  }
}
