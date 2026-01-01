import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { Claim } from '../../../models/claim.model';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">Enter payment details for this claim:</p>

      <div class="space-y-2 bg-muted/30 rounded-lg p-4">
        <div class="flex justify-between">
          <span class="text-sm text-muted-foreground">Employee:</span>
          <span class="text-sm font-medium text-foreground">{{ claim.employee?.full_name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-muted-foreground">Amount to Pay:</span>
          <span class="text-sm font-semibold text-green-600">{{ formatCurrency(claim.amount) }}</span>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label for="paymentMethod" class="block text-sm font-medium text-foreground mb-2">
            Payment Method <span class="text-red-500">*</span>
          </label>
          <select
            id="paymentMethod"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            [(ngModel)]="paymentMethod">
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
        <div>
          <label for="paymentReference" class="block text-sm font-medium text-foreground mb-2">
            Payment Reference <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="paymentReference"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            [(ngModel)]="paymentReference"
            placeholder="Transaction ID, Cheque No, etc." />
        </div>
        <div>
          <label for="paymentDate" class="block text-sm font-medium text-foreground mb-2">
            Payment Date <span class="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="paymentDate"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            [(ngModel)]="paymentDate" />
        </div>
      </div>
    </div>
  `
})
export class PaymentDialogComponent implements OnInit {
  dialogRef = inject(ZardDialogRef);
  claim: Claim = inject(Z_MODAL_DATA);

  paymentMethod = signal<'Bank Transfer' | 'Cash' | 'Cheque'>('Bank Transfer');
  paymentReference = signal('');
  paymentDate = signal('');

  ngOnInit(): void {
    this.initializePaymentDate();
  }

  initializePaymentDate(): void {
    this.paymentDate.set(new Date().toISOString().split('T')[0]);
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  getPaymentData() {
    return {
      payment_method: this.paymentMethod(),
      payment_reference: this.paymentReference(),
      payment_date: this.paymentDate()
    };
  }

  isValid(): boolean {
    return !!this.paymentReference().trim() && !!this.paymentDate();
  }
}
