import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { Claim } from '../../../models/claim.model';

@Component({
  selector: 'app-approval-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">Are you sure you want to approve this claim?</p>

      <div class="space-y-2 bg-muted/30 rounded-lg p-4">
        <div class="flex justify-between">
          <span class="text-sm text-muted-foreground">Employee:</span>
          <span class="text-sm font-medium text-foreground">{{ claim.employee?.full_name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-muted-foreground">Claim Type:</span>
          <span class="text-sm font-medium text-foreground">{{ claim.claimType?.name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-muted-foreground">Amount:</span>
          <span class="text-sm font-semibold text-green-600">{{ formatCurrency(claim.amount) }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted-foreground">Description:</span>
          <span class="text-sm text-foreground">{{ claim.description }}</span>
        </div>
      </div>
    </div>
  `
})
export class ApprovalConfirmationDialogComponent {
  dialogRef = inject(ZardDialogRef);
  claim: Claim = inject(Z_MODAL_DATA);

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }
}
