import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LeaveService } from '../../services/leave.service';
import { Leave, LeaveStatus } from '../../models/leave.model';
import { AuthService } from '../../../../core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

import { LeaveApprovalSheetComponent } from '../leave-approval-sheet/leave-approval-sheet.component';

type SortOption = 'oldest' | 'starts-soonest' | 'most-days';

@Component({
  selector: 'app-leave-approval',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardAvatarComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardSkeletonComponent,
    ZardTooltipModule,
    LeaveApprovalSheetComponent
  ],
  templateUrl: './leave-approval.component.html',
  styleUrl: './leave-approval.component.css'
})
export class LeaveApprovalComponent implements OnInit {
  pendingLeaves = signal<Leave[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  processingLeaveId = signal<string | null>(null);
  processingBulk = signal(false);

  // Filters
  searchTerm = signal('');
  selectedLeaveType = signal<number | null>(null);
  selectedDepartment = signal<string>('');
  sortBy = signal<SortOption>('oldest');

  // Bulk selection
  selectedLeaveIds = signal<Set<string>>(new Set());
  bulkRejectMode = signal(false);
  bulkRejectReason = signal('');

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = 24;

  // Sheet state
  approvalSheetOpen = signal(false);
  approvalSheetLeaveId = signal<string | null>(null);

  // Computed filtered + sorted leaves
  filteredLeaves = computed(() => {
    let leaves = this.pendingLeaves();

    const search = this.searchTerm().toLowerCase();
    if (search) {
      leaves = leaves.filter(leave =>
        leave.employee?.full_name.toLowerCase().includes(search) ||
        leave.employee?.employee_id.toLowerCase().includes(search) ||
        leave.leave_type?.name.toLowerCase().includes(search)
      );
    }

    if (this.selectedLeaveType()) {
      leaves = leaves.filter(leave => leave.leave_type_id === this.selectedLeaveType());
    }

    if (this.selectedDepartment()) {
      leaves = leaves.filter(leave => leave.employee?.department === this.selectedDepartment());
    }

    const sort = this.sortBy();
    leaves = [...leaves].sort((a, b) => {
      if (sort === 'starts-soonest') {
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      }
      if (sort === 'most-days') {
        return (b.total_days || 0) - (a.total_days || 0);
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return leaves;
  });

  // Unique leave types and departments derived from pending leaves
  availableLeaveTypes = computed(() => {
    const types = new Map<number, string>();
    this.pendingLeaves().forEach(leave => {
      if (leave.leave_type_id && leave.leave_type?.name) {
        types.set(leave.leave_type_id, leave.leave_type.name);
      }
    });
    return Array.from(types.entries()).map(([id, name]) => ({ id, name }));
  });

  availableDepartments = computed(() => {
    const departments = new Set<string>();
    this.pendingLeaves().forEach(leave => {
      if (leave.employee?.department) {
        departments.add(leave.employee.department);
      }
    });
    return Array.from(departments);
  });

  // Stats
  totalPending = computed(() => this.pendingLeaves().length);
  totalDaysRequested = computed(() => this.pendingLeaves().reduce((sum, l) => sum + (Number(l.total_days) || 0), 0));
  uniqueEmployees = computed(() => new Set(this.pendingLeaves().map(l => l.employee_id)).size);
  departmentCount = computed(() => this.availableDepartments().length);
  slaBreachCount = computed(() => this.pendingLeaves().filter(l => this.isSlaBreach(l)).length);

  // Bulk selection helpers
  selectedCount = computed(() => this.selectedLeaveIds().size);
  allVisibleSelected = computed(() => {
    const visible = this.filteredLeaves();
    if (visible.length === 0) return false;
    const set = this.selectedLeaveIds();
    return visible.every(l => l.public_id && set.has(l.public_id));
  });
  someVisibleSelected = computed(() => {
    const visible = this.filteredLeaves();
    const set = this.selectedLeaveIds();
    return visible.some(l => l.public_id && set.has(l.public_id));
  });

  private displayService = inject(DisplayService);
  private alertDialogService = inject(ZardAlertDialogService);

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingLeaves();
  }

  loadPendingLeaves(): void {
    this.loading.set(true);
    this.error.set(null);

    this.leaveService.getLeaves({
      status: LeaveStatus.PENDING,
      page: this.currentPage(),
      limit: this.pageSize
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingLeaves.set(response.data.leaves);
          this.totalPages.set(response.data.pagination.totalPages);
        }
        this.loading.set(false);
        // Drop any stale selections that are no longer pending
        this.pruneSelections();
      },
      error: (err) => {
        console.error('Error loading pending leaves:', err);
        this.error.set('Failed to load pending leave applications. Please try again.');
        this.loading.set(false);
      }
    });
  }

  quickApprove(leave: Leave): void {
    if (!leave.public_id) return;

    this.alertDialogService.confirm({
      zTitle: 'Approve Leave',
      zDescription: `Approve ${leave.employee?.full_name}'s ${leave.leave_type?.name} request (${this.getDaysCount(leave)})?`,
      zOkText: 'Approve',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.processingLeaveId.set(leave.public_id!);
        this.leaveService.approveRejectLeave(leave.public_id!, { action: 'approve' }).subscribe({
          next: (response) => {
            if (response.success) {
              this.pendingLeaves.update(leaves => leaves.filter(l => l.public_id !== leave.public_id));
              this.removeFromSelection(leave.public_id!);
              this.alertDialogService.info({
                zTitle: 'Approved',
                zDescription: 'Leave application approved successfully',
                zOkText: 'OK'
              });
            }
            this.processingLeaveId.set(null);
          },
          error: (err) => {
            console.error('Error approving leave:', err);
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: err.error?.message || 'Failed to approve leave',
              zOkText: 'OK'
            });
            this.processingLeaveId.set(null);
          }
        });
      }
    });
  }

  viewLeaveDetails(leave: Leave): void {
    this.approvalSheetLeaveId.set(leave.public_id || null);
    this.approvalSheetOpen.set(true);
  }

  onSheetOpenChange(open: boolean): void {
    this.approvalSheetOpen.set(open);
    if (!open) {
      this.approvalSheetLeaveId.set(null);
    }
  }

  onSheetActionCompleted(): void {
    this.loadPendingLeaves();
  }

  // ─── Bulk selection ───
  isLeaveSelected(publicId?: string | null): boolean {
    return !!publicId && this.selectedLeaveIds().has(publicId);
  }

  toggleLeaveSelection(publicId?: string | null): void {
    if (!publicId) return;
    this.selectedLeaveIds.update(set => {
      const next = new Set(set);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  }

  toggleSelectAllVisible(): void {
    const visible = this.filteredLeaves();
    const allSelected = this.allVisibleSelected();
    this.selectedLeaveIds.update(set => {
      const next = new Set(set);
      visible.forEach(l => {
        if (!l.public_id) return;
        if (allSelected) next.delete(l.public_id);
        else next.add(l.public_id);
      });
      return next;
    });
  }

  clearSelection(): void {
    this.selectedLeaveIds.set(new Set());
    this.bulkRejectMode.set(false);
    this.bulkRejectReason.set('');
  }

  removeFromSelection(publicId: string): void {
    this.selectedLeaveIds.update(set => {
      if (!set.has(publicId)) return set;
      const next = new Set(set);
      next.delete(publicId);
      return next;
    });
  }

  private pruneSelections(): void {
    const valid = new Set(this.pendingLeaves().map(l => l.public_id).filter((id): id is string => !!id));
    this.selectedLeaveIds.update(set => {
      const next = new Set<string>();
      set.forEach(id => { if (valid.has(id)) next.add(id); });
      return next;
    });
  }

  bulkApprove(): void {
    const ids = Array.from(this.selectedLeaveIds());
    if (ids.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Approve selected',
      zDescription: `Approve ${ids.length} leave request${ids.length === 1 ? '' : 's'}?`,
      zOkText: 'Approve all',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.processingBulk.set(true);
        const requests = ids.map(id => this.leaveService.approveRejectLeave(id, { action: 'approve' }));
        forkJoin(requests).subscribe({
          next: () => {
            this.pendingLeaves.update(leaves => leaves.filter(l => !l.public_id || !ids.includes(l.public_id)));
            this.clearSelection();
            this.processingBulk.set(false);
            this.alertDialogService.info({
              zTitle: 'Approved',
              zDescription: `${ids.length} leave request${ids.length === 1 ? '' : 's'} approved.`,
              zOkText: 'OK'
            });
          },
          error: () => {
            this.processingBulk.set(false);
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Some leaves could not be approved. Refreshing list.',
              zOkText: 'OK'
            });
            this.loadPendingLeaves();
          }
        });
      }
    });
  }

  startBulkReject(): void {
    if (this.selectedLeaveIds().size === 0) return;
    this.bulkRejectReason.set('');
    this.bulkRejectMode.set(true);
  }

  cancelBulkReject(): void {
    this.bulkRejectMode.set(false);
    this.bulkRejectReason.set('');
  }

  confirmBulkReject(): void {
    const reason = this.bulkRejectReason().trim();
    if (!reason) {
      this.alertDialogService.warning({
        zTitle: 'Reason required',
        zDescription: 'Please provide a rejection reason that will be sent to all selected applicants.',
        zOkText: 'OK'
      });
      return;
    }

    const ids = Array.from(this.selectedLeaveIds());
    if (ids.length === 0) return;

    this.processingBulk.set(true);
    const requests = ids.map(id => this.leaveService.approveRejectLeave(id, { action: 'reject', rejection_reason: reason }));
    forkJoin(requests).subscribe({
      next: () => {
        this.pendingLeaves.update(leaves => leaves.filter(l => !l.public_id || !ids.includes(l.public_id)));
        this.clearSelection();
        this.processingBulk.set(false);
        this.alertDialogService.info({
          zTitle: 'Rejected',
          zDescription: `${ids.length} leave request${ids.length === 1 ? '' : 's'} rejected.`,
          zOkText: 'OK'
        });
      },
      error: () => {
        this.processingBulk.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Some leaves could not be rejected. Refreshing list.',
          zOkText: 'OK'
        });
        this.loadPendingLeaves();
      }
    });
  }

  // ─── Display helpers ───
  getDaysCount(leave: Leave): string {
    if (leave.is_half_day) {
      return `0.5 day (${leave.half_day_period})`;
    }
    const days = Number(leave.total_days) || 0;
    return days === 1 ? '1 day' : `${days} days`;
  }

  getDaysCountShort(leave: Leave): string {
    if (leave.is_half_day) return '0.5d';
    const days = Number(leave.total_days) || 0;
    return `${days.toFixed(1)} day${days === 1 ? '' : 's'}`;
  }

  formatDate(dateString: string): string {
    return this.displayService.formatDate(dateString);
  }

  formatDateShort(dateString: string): string {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  formatPeriod(leave: Leave): string {
    const start = this.formatDateShort(leave.start_date);
    const end = this.formatDateShort(leave.end_date);
    return start === end ? start : `${start} → ${end}`;
  }

  getLeaveTypeBadge(leaveTypeName?: string): string {
    if (!leaveTypeName) return 'soft-gray';
    const name = leaveTypeName.toLowerCase();
    if (name.includes('medical') || name.includes('sick') || name.includes('hospitalization')) return 'soft-red';
    if (name.includes('annual') || name.includes('vacation')) return 'soft-green';
    if (name.includes('emergency')) return 'soft-orange';
    if (name.includes('maternity') || name.includes('paternity')) return 'soft-pink';
    if (name.includes('study')) return 'soft-blue';
    if (name.includes('unpaid')) return 'soft-gray';
    return 'soft-purple';
  }

  getLeaveTypePillClasses(leaveTypeName?: string): string {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-md ring-1 text-[11px] font-medium whitespace-nowrap';
    if (!leaveTypeName) return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
    const name = leaveTypeName.toLowerCase();
    if (name.includes('annual') || name.includes('vacation')) return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    if (name.includes('medical') || name.includes('sick') || name.includes('hospitalization')) return `${base} bg-violet-50 text-violet-700 ring-violet-200`;
    if (name.includes('emergency')) return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
    if (name.includes('maternity') || name.includes('paternity')) return `${base} bg-pink-50 text-pink-700 ring-pink-200`;
    if (name.includes('study')) return `${base} bg-sky-50 text-sky-700 ring-sky-200`;
    if (name.includes('unpaid')) return `${base} bg-slate-100 text-slate-700 ring-slate-200`;
    return `${base} bg-violet-50 text-violet-700 ring-violet-200`;
  }

  getDaysSincePending(leave: Leave): number {
    const created = new Date(leave.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  getHoursSincePending(leave: Leave): number {
    const created = new Date(leave.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
  }

  isSlaBreach(leave: Leave): boolean {
    return this.getHoursSincePending(leave) >= 48;
  }

  getDaysUntilStart(leave: Leave): number {
    const startDate = new Date(leave.start_date);
    startDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  isUrgent(leave: Leave): boolean {
    const daysUntilStart = this.getDaysUntilStart(leave);
    return daysUntilStart <= 3 && daysUntilStart >= 0;
  }

  urgentLabel(leave: Leave): string {
    const d = this.getDaysUntilStart(leave);
    if (d <= 0) return 'Starts today';
    if (d === 1) return 'Starts tomorrow';
    return `Starts in ${d}d`;
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPendingLeaves();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedLeaveType.set(null);
    this.selectedDepartment.set('');
    this.sortBy.set('oldest');
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm() || this.selectedLeaveType() || this.selectedDepartment() || this.sortBy() !== 'oldest');
  }
}
