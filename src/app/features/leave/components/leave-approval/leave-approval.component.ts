import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { Leave, LeaveStatus } from '../../models/leave.model';
import { AuthService } from '../../../../core/services/auth.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';

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
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective
  ],
  templateUrl: './leave-approval.component.html',
  styleUrl: './leave-approval.component.css'
})
export class LeaveApprovalComponent implements OnInit {
  pendingLeaves = signal<Leave[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  processingLeaveId = signal<number | null>(null);

  // Filters
  searchTerm = signal('');
  selectedLeaveType = signal<number | null>(null);
  selectedDepartment = signal<string>('');

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = 10;

  // Computed filtered leaves
  filteredLeaves = computed(() => {
    let leaves = this.pendingLeaves();

    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      leaves = leaves.filter(leave =>
        leave.employee?.full_name.toLowerCase().includes(search) ||
        leave.employee?.employee_id.toLowerCase().includes(search) ||
        leave.leave_type?.name.toLowerCase().includes(search)
      );
    }

    // Leave type filter
    if (this.selectedLeaveType()) {
      leaves = leaves.filter(leave => leave.leave_type_id === this.selectedLeaveType());
    }

    // Department filter
    if (this.selectedDepartment()) {
      leaves = leaves.filter(leave => leave.employee?.department === this.selectedDepartment());
    }

    return leaves;
  });

  // Rejection reason for modal
  rejectionReason = signal('');
  rejectingLeaveId = signal<number | null>(null);

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

  approveLeave(leaveId: number): void {
    if (!confirm('Are you sure you want to approve this leave application?')) {
      return;
    }

    this.processingLeaveId.set(leaveId);

    this.leaveService.approveRejectLeave(leaveId, { action: 'approve' }).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove from pending list
          this.pendingLeaves.update(leaves => leaves.filter(l => l.id !== leaveId));
          alert('Leave application approved successfully!');
        }
        this.processingLeaveId.set(null);
      },
      error: (err) => {
        console.error('Error approving leave:', err);
        alert('Failed to approve leave application. Please try again.');
        this.processingLeaveId.set(null);
      }
    });
  }

  openRejectModal(leaveId: number): void {
    this.rejectingLeaveId.set(leaveId);
    this.rejectionReason.set('');
  }

  closeRejectModal(): void {
    this.rejectingLeaveId.set(null);
    this.rejectionReason.set('');
  }

  rejectLeave(): void {
    const leaveId = this.rejectingLeaveId();
    if (!leaveId) return;

    if (!this.rejectionReason().trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    this.processingLeaveId.set(leaveId);

    this.leaveService.approveRejectLeave(leaveId, {
      action: 'reject',
      rejection_reason: this.rejectionReason()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove from pending list
          this.pendingLeaves.update(leaves => leaves.filter(l => l.id !== leaveId));
          this.closeRejectModal();
          alert('Leave application rejected successfully!');
        }
        this.processingLeaveId.set(null);
      },
      error: (err) => {
        console.error('Error rejecting leave:', err);
        alert('Failed to reject leave application. Please try again.');
        this.processingLeaveId.set(null);
      }
    });
  }

  getDaysCount(leave: Leave): string {
    const days = leave.total_days;
    if (leave.is_half_day) {
      return `0.5 day (${leave.half_day_period})`;
    }
    return days === 1 ? '1 day' : `${days} days`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getLeaveTypeColor(leaveTypeName: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const name = leaveTypeName.toLowerCase();
    if (name.includes('medical') || name.includes('sick')) return 'destructive';
    if (name.includes('annual') || name.includes('vacation')) return 'default';
    if (name.includes('emergency')) return 'outline';
    return 'secondary';
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

  viewLeaveDetails(leave: Leave): void {
    this.router.navigate(['/dashboard/leave', leave.id]);
  }
}
