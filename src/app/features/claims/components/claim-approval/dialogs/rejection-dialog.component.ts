import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { Claim } from '../../../models/claim.model';

@Component({
  selector: 'app-rejection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">Please provide a reason for rejecting this claim:</p>

      <div class="space-y-2 bg-muted/30 rounded-lg p-4">
        <div class="flex justify-between">
          <span class="text-sm text-muted-foreground">Employee:</span>
          <span class="text-sm font-medium text-foreground">{{ claim.employee?.full_name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-muted-foreground">Amount:</span>
          <span class="text-sm font-semibold text-foreground">{{ formatCurrency(claim.amount) }}</span>
        </div>
      </div>

      <div>
        <label for="rejectionReason" class="block text-sm font-medium text-foreground mb-2">
          Rejection Reason <span class="text-red-500">*</span>
        </label>
        <textarea
          id="rejectionReason"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          [(ngModel)]="rejectionReason"
          rows="4"
          placeholder="Enter reason for rejection..."></textarea>
      </div>
    </div>
  `
})
export class RejectionDialogComponent {
  dialogRef = inject(ZardDialogRef);
  claim: Claim = inject(Z_MODAL_DATA);
  rejectionReason = signal('');

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  getRejectionReason(): string {
    return this.rejectionReason();
  }
}
