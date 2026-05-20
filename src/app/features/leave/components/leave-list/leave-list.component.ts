import { Component, OnDestroy, OnInit, computed, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LeaveService } from '../../services/leave.service';
import { LeaveRefreshService } from '../../services/leave-refresh.service';
import { LeaveFilterService } from '../../services/leave-filter.service';
import { AuthService } from '@/core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';
import { Leave, LeaveStatus, LEAVE_STATUS_COLORS, LEAVE_STATUS_ICONS } from '../../models/leave.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardSegmentedComponent, SegmentedOption } from '@/shared/components/segmented/segmented.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { LeaveFormSheetComponent } from '../leave-form-sheet/leave-form-sheet.component';
import { LeaveApprovalSheetComponent } from '../leave-approval-sheet/leave-approval-sheet.component';

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardTableImports,
    ZardTooltipModule,
    ZardCheckboxComponent,
    ZardEmptyComponent,
    ZardAvatarComponent,
    ZardDividerComponent,
    ZardSkeletonComponent,
    ZardSegmentedComponent,
    ZardDatePickerComponent,
    LeaveFormSheetComponent,
    LeaveApprovalSheetComponent
  ],
  templateUrl: './leave-list.component.html',
  styleUrl: './leave-list.component.css'
})
export class LeaveListComponent implements OnInit, OnDestroy {
  private leaveService = inject(LeaveService);
  private router = inject(Router);
  private alertDialogService = inject(ZardAlertDialogService);
  private authService = inject(AuthService);
  private displayService = inject(DisplayService);
  private refreshService = inject(LeaveRefreshService);
  filters = inject(LeaveFilterService);
  private destroy$ = new Subject<void>();

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

  // Filters now live in the shared LeaveFilterService — these expose them for the template.
  selectedStatus = this.filters.status;
  startDateFilter = this.filters.startDate;
  endDateFilter = this.filters.endDate;
  selectedLeaveType = signal<number | ''>('');

  // Date-picker two-way bindings (component-local; service holds the ISO string)
  startDateValue: Date | null = null;
  endDateValue: Date | null = null;

  // Bumped by Reset → forces z-segmented to remount so its internal state
  // realigns with the service's cleared value.
  resetToken = signal(0);

  // Status filter options
  statusOptions: SegmentedOption[] = [
    { value: '', label: 'All' },
    { value: LeaveStatus.PENDING, label: 'Pending' },
    { value: LeaveStatus.APPROVED, label: 'Approved' },
    { value: LeaveStatus.REJECTED, label: 'Rejected' },
    { value: LeaveStatus.CANCELLED, label: 'Cancelled' }
  ];

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
    period: true,
    duration: true,
    status: true
  });

  // Column list for toggle menu
  columnList = [
    { key: 'employee', label: 'Employee' },
    { key: 'leaveType', label: 'Leave Type' },
    { key: 'period', label: 'Period' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status' }
  ];

  // Sheet state
  formSheetOpen = signal(false);
  formSheetLeaveId = signal<string | null>(null);
  approvalSheetOpen = signal(false);
  approvalSheetLeaveId = signal<string | null>(null);

  // Constants
  LeaveStatus = LeaveStatus;
  LEAVE_STATUS_COLORS = LEAVE_STATUS_COLORS;
  LEAVE_STATUS_ICONS = LEAVE_STATUS_ICONS;
  Math = Math;

  constructor() {
    // Reload whenever any shared filter (status / start / end date) changes.
    effect(() => {
      this.filters.status();
      this.filters.startDate();
      this.filters.endDate();
      if (this.hasProfile()) {
        this.currentPage.set(1);
        this.loadLeaves();
      }
    });

    // Mirror local row selection into the shared filter service so the
    // leave-page card can render bulk-action buttons + enable/disable them
    // based on the statuses of the selected leaves.
    effect(() => {
      const ids = this.selectedLeaves();
      const all = this.leaves();
      const selected = all.filter((l) => ids.has(l.id));
      this.filters.setSelectedLeaves(selected);
    });
  }

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

    this.refreshService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadLeaves());

    // Bulk actions dispatched from the parent leave-page card
    this.filters.bulkAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe((action) => {
        if (action === 'approve') this.bulkApprove();
        else if (action === 'reject') this.bulkReject();
        else if (action === 'clear') this.clearSelection();
      });
  }

  ngOnDestroy(): void {
    // Selection only makes sense while the list is mounted — drop it so the
    // bulk-action area in the parent card hides when leaving the tab.
    this.filters.clearSelection();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Sort column mapping (frontend key → backend field)
  private sortColumnMap: Record<string, string> = {
    period: 'start_date',
    duration: 'total_days',
    status: 'status'
  };

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
    if (this.sortColumn()) {
      params.sort = this.sortColumnMap[this.sortColumn()];
      params.order = this.sortDirection();
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

  onStatusChange(value: string): void {
    this.filters.setStatus(value as LeaveStatus | '');
  }

  onStartDateChange(date: Date | null): void {
    this.filters.setStartDate(date ? this.toIsoDate(date) : '');
  }

  onEndDateChange(date: Date | null): void {
    this.filters.setEndDate(date ? this.toIsoDate(date) : '');
  }

  resetListFilters(): void {
    this.startDateValue = null;
    this.endDateValue = null;
    this.filters.clearListFilters();
    this.resetToken.update((v) => v + 1);
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
        this.leaveService.approveRejectLeave(leave.public_id!, {
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

        this.leaveService.approveRejectLeave(leave.public_id!, {
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
        this.leaveService.cancelLeave(leave.public_id!).subscribe({
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
    const pending = this.filters
      .selectedLeaves()
      .filter((l) => l.status === LeaveStatus.PENDING);

    if (pending.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'Nothing to approve',
        zDescription: 'Only Pending leaves can be approved. Adjust your selection.',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Approve Selected Leaves',
      zDescription: `Approve ${pending.length} pending leave application(s)?`,
      zOkText: 'Approve All',
      zCancelText: 'Cancel',
      zOnOk: () =>
        this.runBulk(
          pending,
          (l) => this.leaveService.approveRejectLeave(l.public_id!, { action: 'approve' }),
          'approved'
        )
    });
  }

  bulkReject(): void {
    const pending = this.filters
      .selectedLeaves()
      .filter((l) => l.status === LeaveStatus.PENDING);

    if (pending.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'Nothing to reject',
        zDescription: 'Only Pending leaves can be rejected. Adjust your selection.',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Reject Selected Leaves',
      zDescription: `Reject ${pending.length} pending leave application(s)?`,
      zOkText: 'Reject All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
        this.runBulk(
          pending,
          (l) =>
            this.leaveService.approveRejectLeave(l.public_id!, {
              action: 'reject',
              rejection_reason: reason
            }),
          'rejected'
        );
      }
    });
  }

  private runBulk(
    leaves: Leave[],
    op: (l: Leave) => import('rxjs').Observable<unknown>,
    pastTense: 'approved' | 'rejected'
  ): void {
    let done = 0;
    let failed = 0;
    leaves.forEach((leave) => {
      op(leave).subscribe({
        next: () => {
          done++;
          if (done + failed === leaves.length) this.finalizeBulk(pastTense, done, failed);
        },
        error: (err) => {
          failed++;
          console.error(`Bulk ${pastTense} failed for leave ${leave.id}:`, err);
          if (done + failed === leaves.length) this.finalizeBulk(pastTense, done, failed);
        }
      });
    });
  }

  private finalizeBulk(
    pastTense: 'approved' | 'rejected',
    done: number,
    failed: number
  ): void {
    if (failed === 0) {
      this.alertDialogService.info({
        zTitle: 'Success',
        zDescription: `${done} leave(s) ${pastTense}.`,
        zOkText: 'OK'
      });
    } else {
      this.alertDialogService.warning({
        zTitle: 'Partial result',
        zDescription: `${done} ${pastTense}, ${failed} failed. Check the console for details.`,
        zOkText: 'OK'
      });
    }
    this.clearSelection();
    this.loadLeaves();
  }

  getStatusBadgeClass(status: LeaveStatus): string {
    return `badge bg-${LEAVE_STATUS_COLORS[status]}`;
  }

  getStatusIcon(status: LeaveStatus): string {
    return LEAVE_STATUS_ICONS[status];
  }

  formatDate(date: string | Date): string {
    return this.displayService.formatDate(date);
  }

  getDuration(leave: Leave): string {
    if (leave.is_half_day) {
      return '0.5 day';
    }
    return `${leave.total_days} ${leave.total_days === 1 ? 'day' : 'days'}`;
  }

  getStatusDotClass(status: LeaveStatus): string {
    const dotMap: Record<string, string> = {
      'Pending': 'bg-yellow-500',
      'Approved': 'bg-green-500',
      'Rejected': 'bg-red-500',
      'Cancelled': 'bg-gray-400'
    };
    return dotMap[status] || 'bg-gray-400';
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

  getStatusBadgeType(status: LeaveStatus): string {
    const badgeMap: Record<string, string> = {
      'Pending': 'soft-yellow',
      'Approved': 'soft-green',
      'Rejected': 'soft-red',
      'Cancelled': 'soft-gray'
    };
    return badgeMap[status] || 'soft-gray';
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

  getStatusDisplayName(): string {
    const status = this.selectedStatus();
    if (!status) return 'Status';
    return status.replace('_', ' ');
  }

  viewLeaveDetails(leave: Leave): void {
    this.approvalSheetLeaveId.set(leave.public_id || null);
    this.approvalSheetOpen.set(true);
  }

  openEditLeaveSheet(leave: Leave): void {
    this.formSheetLeaveId.set(leave.public_id || null);
    this.formSheetOpen.set(true);
  }

  onFormSheetClose(open: boolean): void {
    this.formSheetOpen.set(open);
    if (!open) {
      this.formSheetLeaveId.set(null);
    }
  }

  onFormSheetSaved(): void {
    this.loadLeaves();
  }

  onApprovalSheetClose(open: boolean): void {
    this.approvalSheetOpen.set(open);
    if (!open) {
      this.approvalSheetLeaveId.set(null);
    }
  }

  onApprovalSheetAction(): void {
    this.loadLeaves();
  }

  // Sorting methods (API-side)
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.loadLeaves();
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
