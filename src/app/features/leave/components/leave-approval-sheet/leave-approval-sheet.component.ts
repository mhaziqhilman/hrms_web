import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ZardSheetImports } from '@/shared/components/sheet/sheet.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

import { LeaveService } from '../../services/leave.service';
import { Leave, LeaveStatus } from '../../models/leave.model';
import { DisplayService } from '@/core/services/display.service';

@Component({
  selector: 'app-leave-approval-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardSheetImports,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardDividerComponent,
    ZardInputDirective
  ],
  templateUrl: './leave-approval-sheet.component.html',
  styleUrl: './leave-approval-sheet.component.css'
})
export class LeaveApprovalSheetComponent implements OnChanges {
  @Input() open = false;
  @Input() leaveId: string | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() actionCompleted = new EventEmitter<void>();

  private leaveService = inject(LeaveService);
  private alertDialogService = inject(ZardAlertDialogService);
  private displayService = inject(DisplayService);

  leave = signal<Leave | null>(null);
  loading = signal(false);
  processing = signal(false);

  showRejectInput = signal(false);
  rejectionReason = '';

  LeaveStatus = LeaveStatus;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open && this.leaveId) {
      this.loadLeave();
    }
    if (changes['open'] && !this.open) {
      this.showRejectInput.set(false);
      this.rejectionReason = '';
    }
  }

  private loadLeave(): void {
    if (!this.leaveId) return;
    this.loading.set(true);
    this.leaveService.getLeaveById(this.leaveId).subscribe({
      next: (res) => {
        if (res.success) {
          this.leave.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  formatDate(date: string): string {
    return this.displayService.formatDate(date);
  }

  formatDateTime(date: string): string {
    return this.displayService.formatDateTime(date);
  }

  getStatusBadgeType(status: LeaveStatus): string {
    switch (status) {
      case LeaveStatus.PENDING: return 'soft-yellow';
      case LeaveStatus.APPROVED: return 'soft-green';
      case LeaveStatus.REJECTED: return 'soft-red';
      case LeaveStatus.CANCELLED: return 'soft-gray';
      default: return 'soft-gray';
    }
  }

  approve(): void {
    const leave = this.leave();
    if (!leave?.public_id) return;

    this.processing.set(true);
    this.leaveService.approveRejectLeave(leave.public_id, {
      action: 'approve'
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.alertDialogService.info({
            zTitle: 'Approved',
            zDescription: 'Leave application has been approved successfully',
            zOkText: 'OK'
          });
          this.actionCompleted.emit();
          this.close();
        }
        this.processing.set(false);
      },
      error: (err) => {
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: err.error?.message || 'Failed to approve leave',
          zOkText: 'OK'
        });
        this.processing.set(false);
      }
    });
  }

  openRejectInput(): void {
    this.showRejectInput.set(true);
  }

  cancelReject(): void {
    this.showRejectInput.set(false);
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.rejectionReason.trim() || this.rejectionReason.trim().length < 5) {
      this.alertDialogService.warning({
        zTitle: 'Reason Required',
        zDescription: 'Please provide a rejection reason (at least 5 characters)',
        zOkText: 'OK'
      });
      return;
    }

    const leave = this.leave();
    if (!leave?.public_id) return;

    this.processing.set(true);
    this.leaveService.approveRejectLeave(leave.public_id, {
      action: 'reject',
      rejection_reason: this.rejectionReason.trim()
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.alertDialogService.info({
            zTitle: 'Rejected',
            zDescription: 'Leave application has been rejected',
            zOkText: 'OK'
          });
          this.actionCompleted.emit();
          this.close();
        }
        this.processing.set(false);
      },
      error: (err) => {
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: err.error?.message || 'Failed to reject leave',
          zOkText: 'OK'
        });
        this.processing.set(false);
      }
    });
  }

  close(): void {
    this.openChange.emit(false);
  }

  handleOpenChange(open: boolean): void {
    this.openChange.emit(open);
  }
}
