import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { Leave, LeaveStatus } from '../../models/leave.model';
import { AuthService } from '../../../../core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

import { LeaveApprovalSheetComponent } from '../leave-approval-sheet/leave-approval-sheet.component';

@Component({
  selector: 'app-leave-approval',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardSkeletonComponent,
    ZardEmptyComponent,
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

  // Filters
  searchTerm = signal('');
  selectedLeaveType = signal<number | null>(null);
  selectedDepartment = signal<string>('');

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = 24;

  // Sheet state
  approvalSheetOpen = signal(false);
  approvalSheetLeaveId = signal<string | null>(null);

  // Computed filtered leaves
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
  totalDaysRequested = computed(() => this.pendingLeaves().reduce((sum, l) => sum + (l.total_days || 0), 0));
  uniqueEmployees = computed(() => new Set(this.pendingLeaves().map(l => l.employee_id)).size);

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

  getDaysCount(leave: Leave): string {
    const days = leave.total_days;
    if (leave.is_half_day) {
      return `0.5 day (${leave.half_day_period})`;
    }
    return days === 1 ? '1 day' : `${days} days`;
  }

  formatDate(dateString: string): string {
    return this.displayService.formatDate(dateString);
  }

  formatDateShort(dateString: string): string {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
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

  getDaysSincePending(leave: Leave): number {
    const created = new Date(leave.created_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  isUrgent(leave: Leave): boolean {
    const startDate = new Date(leave.start_date);
    const now = new Date();
    const daysUntilStart = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilStart <= 3 && daysUntilStart >= 0;
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPendingLeaves();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedLeaveType.set(null);
    this.selectedDepartment.set('');
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm() || this.selectedLeaveType() || this.selectedDepartment());
  }
}
