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
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

import { ClaimService } from '../../services/claim.service';
import { Claim } from '../../models/claim.model';
import { DisplayService } from '@/core/services/display.service';
import { AuthService } from '@/core/services/auth.service';

type ApprovalAction = 'none' | 'approve' | 'reject' | 'pay';

@Component({
  selector: 'app-claim-approval-sheet',
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
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent
  ],
  templateUrl: './claim-approval-sheet.component.html',
  styleUrl: './claim-approval-sheet.component.css'
})
export class ClaimApprovalSheetComponent implements OnChanges {
  @Input() open = false;
  @Input() claimId: string | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() actionCompleted = new EventEmitter<void>();

  private claimService = inject(ClaimService);
  private alertDialogService = inject(ZardAlertDialogService);
  private displayService = inject(DisplayService);
  private authService = inject(AuthService);

  claim = signal<Claim | null>(null);
  loading = signal(false);
  processing = signal(false);

  activeAction = signal<ApprovalAction>('none');
  rejectionReason = '';
  paymentDate = '';
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Cheque' = 'Bank Transfer';
  paymentReference = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open && this.claimId) {
      this.loadClaim();
    }
    if (changes['open'] && !this.open) {
      this.resetAction();
    }
  }

  private resetAction(): void {
    this.activeAction.set('none');
    this.rejectionReason = '';
    this.paymentDate = '';
    this.paymentMethod = 'Bank Transfer';
    this.paymentReference = '';
  }

  private loadClaim(): void {
    if (!this.claimId) return;
    this.loading.set(true);
    this.claimService.getClaimById(this.claimId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.claim.set(res.data);
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

  formatCurrency(amount: number | string | null | undefined): string {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (n === null || n === undefined || isNaN(n)) return 'RM 0.00';
    return `RM ${n.toFixed(2)}`;
  }

  getStatusBadgeType(status: string): string {
    switch (status) {
      case 'Pending': return 'soft-yellow';
      case 'Manager_Approved': return 'soft-blue';
      case 'Finance_Approved': return 'soft-purple';
      case 'Paid': return 'soft-green';
      case 'Rejected': return 'soft-red';
      default: return 'soft-gray';
    }
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ');
  }

  getWorkflowStep(): number {
    const claim = this.claim();
    if (!claim) return 0;
    switch (claim.status) {
      case 'Pending': return 1;
      case 'Manager_Approved': return 2;
      case 'Finance_Approved': return 3;
      case 'Paid': return 4;
      case 'Rejected': return -1;
      default: return 0;
    }
  }

  isManagerApproval(): boolean {
    return this.claim()?.status === 'Pending';
  }

  isFinanceApproval(): boolean {
    return this.claim()?.status === 'Manager_Approved';
  }

  canMarkAsPaid(): boolean {
    return this.claim()?.status === 'Finance_Approved';
  }

  canTakeAction(): boolean {
    const role = this.authService.getCurrentUserValue()?.role;
    if (!role) return false;
    if (this.isManagerApproval()) {
      return role === 'manager' || role === 'admin' || role === 'super_admin';
    }
    return role === 'admin' || role === 'super_admin';
  }

  // Actions
  openApproveConfirm(): void {
    this.activeAction.set('approve');
  }

  openReject(): void {
    this.activeAction.set('reject');
  }

  openPayForm(): void {
    this.activeAction.set('pay');
    this.paymentDate = new Date().toISOString().split('T')[0];
  }

  cancelAction(): void {
    this.resetAction();
  }

  confirmApprove(): void {
    const claim = this.claim();
    if (!claim?.public_id) return;

    this.processing.set(true);
    if (this.isManagerApproval()) {
      this.claimService.managerApproval(claim.public_id, { action: 'approve' }).subscribe({
        next: (res) => this.handleActionSuccess(res, 'Claim approved by manager'),
        error: (err) => this.handleActionError(err, 'Failed to approve claim')
      });
    } else if (this.isFinanceApproval()) {
      this.claimService.financeApproval(claim.public_id, { action: 'approve' }).subscribe({
        next: (res) => this.handleActionSuccess(res, 'Claim approved by finance'),
        error: (err) => this.handleActionError(err, 'Failed to approve claim')
      });
    }
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
    const claim = this.claim();
    if (!claim?.public_id) return;

    this.processing.set(true);
    const payload = { action: 'reject' as const, rejection_reason: this.rejectionReason.trim() };

    if (this.isManagerApproval()) {
      this.claimService.managerApproval(claim.public_id, payload).subscribe({
        next: (res) => this.handleActionSuccess(res, 'Claim rejected'),
        error: (err) => this.handleActionError(err, 'Failed to reject claim')
      });
    } else if (this.isFinanceApproval()) {
      this.claimService.financeApproval(claim.public_id, payload).subscribe({
        next: (res) => this.handleActionSuccess(res, 'Claim rejected'),
        error: (err) => this.handleActionError(err, 'Failed to reject claim')
      });
    }
  }

  confirmPay(): void {
    if (!this.paymentDate || !this.paymentMethod) {
      this.alertDialogService.warning({
        zTitle: 'Missing Information',
        zDescription: 'Please provide payment date and method',
        zOkText: 'OK'
      });
      return;
    }
    const claim = this.claim();
    if (!claim?.public_id) return;

    this.processing.set(true);
    this.claimService.financeApproval(claim.public_id, {
      action: 'paid',
      payment_date: this.paymentDate,
      payment_method: this.paymentMethod,
      payment_reference: this.paymentReference || undefined
    }).subscribe({
      next: (res) => this.handleActionSuccess(res, 'Claim marked as paid'),
      error: (err) => this.handleActionError(err, 'Failed to mark as paid')
    });
  }

  private handleActionSuccess(res: any, message: string): void {
    this.processing.set(false);
    if (res.success) {
      this.alertDialogService.info({
        zTitle: 'Success',
        zDescription: message,
        zOkText: 'OK'
      });
      this.actionCompleted.emit();
      this.close();
    }
  }

  private handleActionError(err: any, defaultMsg: string): void {
    this.processing.set(false);
    this.alertDialogService.warning({
      zTitle: 'Error',
      zDescription: err.error?.message || defaultMsg,
      zOkText: 'OK'
    });
  }

  close(): void {
    this.openChange.emit(false);
  }

  handleOpenChange(open: boolean): void {
    this.openChange.emit(open);
  }
}
