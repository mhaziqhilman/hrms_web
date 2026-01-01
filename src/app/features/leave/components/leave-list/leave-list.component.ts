import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { Leave, LeaveStatus, LEAVE_STATUS_COLORS, LEAVE_STATUS_ICONS } from '../../models/leave.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';

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
    ZardTableImports
  ],
  templateUrl: './leave-list.component.html',
  styleUrl: './leave-list.component.css'
})
export class LeaveListComponent implements OnInit {
  leaves = signal<Leave[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  limit = 10;
  total = signal(0);

  // Filters
  selectedStatus = signal<LeaveStatus | ''>('');
  selectedLeaveType = signal<number | ''>('');
  startDateFilter = signal<string>('');
  endDateFilter = signal<string>('');

  // Date picker values
  startDateValue: Date | null = null;
  endDateValue: Date | null = null;

  // Constants
  LeaveStatus = LeaveStatus;
  LEAVE_STATUS_COLORS = LEAVE_STATUS_COLORS;
  LEAVE_STATUS_ICONS = LEAVE_STATUS_ICONS;
  Math = Math;

  constructor(
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLeaves();
  }

  loadLeaves(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: any = {
      page: this.currentPage(),
      limit: this.limit
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

  approveLeave(leave: Leave): void {
    if (!confirm(`Are you sure you want to approve leave for ${leave.employee?.full_name}?`)) {
      return;
    }

    this.leaveService.approveRejectLeave(leave.id, {
      action: 'approve'
    }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Leave approved successfully');
          this.loadLeaves();
        }
      },
      error: (err) => {
        alert('Failed to approve leave');
        console.error('Error approving leave:', err);
      }
    });
  }

  rejectLeave(leave: Leave): void {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) {
      return;
    }

    this.leaveService.approveRejectLeave(leave.id, {
      action: 'reject',
      rejection_reason: reason
    }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Leave rejected successfully');
          this.loadLeaves();
        }
      },
      error: (err) => {
        alert('Failed to reject leave');
        console.error('Error rejecting leave:', err);
      }
    });
  }

  cancelLeave(leave: Leave): void {
    if (!confirm('Are you sure you want to cancel this leave application?')) {
      return;
    }

    this.leaveService.cancelLeave(leave.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Leave cancelled successfully');
          this.loadLeaves();
        }
      },
      error: (err) => {
        alert('Failed to cancel leave');
        console.error('Error cancelling leave:', err);
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
    return leave.status === LeaveStatus.PENDING;
  }

  canApprove(leave: Leave): boolean {
    return leave.status === LeaveStatus.PENDING;
  }

  canReject(leave: Leave): boolean {
    return leave.status === LeaveStatus.PENDING;
  }

  canCancel(leave: Leave): boolean {
    return leave.status === LeaveStatus.PENDING;
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
    this.router.navigate(['/dashboard/leave', leave.id]);
  }
}
