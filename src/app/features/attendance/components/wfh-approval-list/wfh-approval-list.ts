import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { WFHApplication } from '../../models/attendance.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-wfh-approval-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardMenuImports,
    ZardTableImports,
    ZardTooltipModule
  ],
  templateUrl: './wfh-approval-list.html',
  styleUrl: './wfh-approval-list.css'
})
export class WfhApprovalListComponent implements OnInit {
  // WFH Applications List
  wfhApplications = signal<WFHApplication[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  limit = 10;

  // Filter
  selectedStatus = signal<'Pending' | 'Approved' | 'Rejected' | ''>('Pending');
  searchQuery = signal<string>('');

  // Manager ID (should come from auth service)
  managerId = signal<number | null>(null); // TODO: Get from auth service

  // Rejection modal
  showRejectionModal = signal(false);
  selectedApplicationId = signal<number | null>(null);
  rejectionReason = signal<string>('');

  private alertDialogService = inject(ZardAlertDialogService);

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.loadWFHApplications();
  }

  loadWFHApplications(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: any = {
      status: this.selectedStatus() || undefined,
      page: this.currentPage(),
      limit: this.limit,
      manager_view: true
    };

    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }

    this.attendanceService.getWFHApplications(params).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          let data: any[] = [];

          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.wfh_applications && Array.isArray(response.data.wfh_applications)) {
              data = response.data.wfh_applications;
            } else if (response.data.wfhApplications && Array.isArray(response.data.wfhApplications)) {
              data = response.data.wfhApplications;
            }
          }

          this.wfhApplications.set(data);

          const paginationObj = response.pagination || response.data?.pagination;
          if (paginationObj) {
            this.totalPages.set(paginationObj.totalPages || 1);
            this.totalRecords.set(paginationObj.totalRecords || data.length);
          } else {
            this.totalPages.set(1);
            this.totalRecords.set(data.length);
          }
        } else {
          this.wfhApplications.set([]);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load WFH applications');
        this.wfhApplications.set([]);
        this.loading.set(false);
      }
    });
  }

  getStatusDisplayName(): string {
    return this.selectedStatus() || 'All Status';
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadWFHApplications();
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadWFHApplications();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadWFHApplications();
    }
  }

  approveApplication(id: number): void {
    this.alertDialogService.confirm({
      zTitle: 'Approve WFH Application',
      zDescription: 'Are you sure you want to approve this WFH application? This action cannot be undone.',
      zOkText: 'Approve',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.attendanceService.approveRejectWFH(id, 'approve').subscribe({
          next: (response) => {
            if (response.success) {
              this.success.set('WFH application approved successfully');
              this.loadWFHApplications();
              setTimeout(() => this.success.set(null), 3000);
            }
          },
          error: (err) => {
            this.error.set(err.error?.message || 'Failed to approve WFH application');
            setTimeout(() => this.error.set(null), 5000);
          }
        });
      }
    });
  }

  openRejectionModal(id: number): void {
    this.selectedApplicationId.set(id);
    this.rejectionReason.set('');
    this.showRejectionModal.set(true);
  }

  closeRejectionModal(): void {
    this.showRejectionModal.set(false);
    this.selectedApplicationId.set(null);
    this.rejectionReason.set('');
  }

  submitRejection(): void {
    const id = this.selectedApplicationId();
    const reason = this.rejectionReason().trim();

    if (!id) return;

    if (!reason) {
      alert('Please provide a reason for rejection');
      return;
    }

    this.attendanceService.approveRejectWFH(id, 'reject', reason).subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set('WFH application rejected');
          this.loadWFHApplications();
          this.closeRejectionModal();
          setTimeout(() => this.success.set(null), 3000);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to reject WFH application');
        setTimeout(() => this.error.set(null), 5000);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '--';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isPastDate(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  canApproveReject(application: WFHApplication): boolean {
    return application.status === 'Pending' && !this.isPastDate(application.date);
  }

  getEmployeeInitial(application: WFHApplication): string {
    return (application.employee?.full_name || 'U').charAt(0).toUpperCase();
  }

  Math = Math;
}
