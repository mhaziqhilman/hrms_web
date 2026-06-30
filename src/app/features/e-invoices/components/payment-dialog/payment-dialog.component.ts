import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';

import { EInvoiceService } from '../../services/e-invoice.service';
import { Invoice, InvoicePayment, PaymentMethod } from '../../models/invoice.model';

export interface PaymentDialogData {
  invoice: Invoice;
  onSuccess?: (payment: InvoicePayment) => void;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardDividerComponent
  ],
  templateUrl: './payment-dialog.component.html'
})
export class PaymentDialogComponent implements OnInit {
  private invoiceService = inject(EInvoiceService);
  private dialogRef = inject(ZardDialogRef);
  private data = inject(Z_MODAL_DATA, { optional: true }) as PaymentDialogData | null;

  readonly PAYMENT_METHODS: PaymentMethod[] = ['Bank Transfer', 'Cash', 'Cheque', 'Credit Card', 'E-Wallet', 'Other'];

  invoice!: Invoice;
  balanceDue = signal(0);

  // Form fields
  paymentDate = this.formatLocalDate(new Date());
  paymentAmount = signal(0);
  paymentMethod: PaymentMethod = 'Bank Transfer';
  paymentRef = '';
  paymentNotes = '';
  saving = signal(false);

  // Derived
  remainingAfter = computed(() => {
    const r = this.balanceDue() - (this.paymentAmount() || 0);
    return r < 0 ? 0 : r;
  });
  amountExceeds = computed(() => (this.paymentAmount() || 0) > this.balanceDue() + 0.001);
  amountValid = computed(() => (this.paymentAmount() || 0) > 0 && !this.amountExceeds());

  ngOnInit() {
    if (!this.data?.invoice) {
      this.dialogRef.close();
      return;
    }
    this.invoice = this.data.invoice;
    const balance = parseFloat(this.invoice.balance_due as any) || 0;
    this.balanceDue.set(balance);
    this.paymentAmount.set(parseFloat(balance.toFixed(2)));
  }

  payFull() {
    this.paymentAmount.set(parseFloat(this.balanceDue().toFixed(2)));
  }

  onAmountChange(value: number) {
    this.paymentAmount.set(Number(value) || 0);
  }

  save() {
    if (!this.amountValid() || this.saving()) return;
    this.saving.set(true);

    this.invoiceService.recordPayment(this.invoice.public_id, {
      payment_date: this.paymentDate,
      amount: this.paymentAmount(),
      payment_method: this.paymentMethod,
      reference_number: this.paymentRef || undefined,
      notes: this.paymentNotes || undefined
    } as Partial<InvoicePayment>).subscribe({
      next: (res) => {
        this.saving.set(false);
        toast.success('Payment recorded successfully');
        this.data?.onSuccess?.(res.data as InvoicePayment);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.saving.set(false);
        toast.error(err?.error?.message || 'Failed to record payment');
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }

  formatCurrency(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return (num || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Format a Date as YYYY-MM-DD using LOCAL components (avoids UTC day-shift in UTC+8).
  private formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
