import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';

import { EInvoiceService } from '../../services/e-invoice.service';
import { InvoiceFormDialogComponent } from '../invoice-form-dialog/invoice-form-dialog.component';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';
import {
  Invoice,
  InvoicePayment,
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_COLORS
} from '../../models/invoice.model';

interface ActivityEvent {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  actor?: string;
  timestamp: string;
}

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardTableImports,
    ZardDividerComponent,
    ZardMenuImports
  ],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css']
})
export class InvoiceDetailComponent implements OnInit {
  private invoiceService = inject(EInvoiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertDialogService = inject(ZardAlertDialogService);
  private dialogService = inject(ZardDialogService);

  // State
  loading = signal(true);
  invoice = signal<Invoice | null>(null);
  submitting = signal(false);
  checkingStatus = signal(false);
  printPreview = signal(false);

  // Payment status (invoice-level)
  paidPercent = computed(() => {
    const inv = this.invoice();
    if (!inv) return 0;
    const total = +inv.total_amount || 0;
    if (total <= 0) return 0;
    const pct = ((+inv.amount_paid || 0) / total) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  });
  paymentStatus = computed<{ label: string; dotClass: string; textClass: string }>(() => {
    const inv = this.invoice();
    if (!inv) return { label: 'Unpaid', dotClass: 'bg-muted-foreground', textClass: 'text-muted-foreground' };
    const paid = +inv.amount_paid || 0;
    const total = +inv.total_amount || 0;
    if (paid >= total && total > 0) {
      return { label: 'Paid', dotClass: 'bg-emerald-500', textClass: 'text-emerald-600' };
    }
    if (paid > 0) {
      return { label: 'Partially paid', dotClass: 'bg-amber-500', textClass: 'text-amber-600' };
    }
    const overdue = inv.due_date && new Date(inv.due_date) < new Date();
    if (overdue) {
      return { label: 'Overdue', dotClass: 'bg-red-500', textClass: 'text-red-600' };
    }
    return { label: 'Unpaid', dotClass: 'bg-muted-foreground', textClass: 'text-muted-foreground' };
  });

  // Cancel form
  showCancelForm = signal(false);
  cancelReason = '';

  // Activity log (computed to avoid recalculating on every CD cycle)
  activityLog = computed(() => {
    const inv = this.invoice();
    if (!inv) return [];
    return this.buildActivityLog(inv);
  });

  readonly TYPE_LABELS = INVOICE_TYPE_LABELS;
  readonly STATUS_COLORS = INVOICE_STATUS_COLORS;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadInvoice(id);
  }

  loadInvoice(id: string) {
    this.loading.set(true);
    this.invoiceService.getInvoice(id).subscribe({
      next: (res) => {
        if (res.success) this.invoice.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/e-invoices']);
      }
    });
  }

  // ─── Actions ─────────────────────────────────────────────

  onApprove() {
    const inv = this.invoice();
    if (!inv) return;
    this.invoiceService.approveInvoice(inv.public_id).subscribe({
      next: (res) => {
        if (res.success) this.loadInvoice(inv.public_id);
      }
    });
  }

  onSubmitToLhdn() {
    const inv = this.invoice();
    if (!inv) return;
    this.submitting.set(true);
    this.invoiceService.submitToLhdn(inv.public_id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.loadInvoice(inv.public_id);
      },
      error: () => this.submitting.set(false)
    });
  }

  onCheckStatus() {
    const inv = this.invoice();
    if (!inv) return;
    this.checkingStatus.set(true);
    this.invoiceService.checkLhdnStatus(inv.public_id).subscribe({
      next: () => {
        this.checkingStatus.set(false);
        this.loadInvoice(inv.public_id);
      },
      error: () => this.checkingStatus.set(false)
    });
  }

  onCancel() {
    const inv = this.invoice();
    if (!inv || !this.cancelReason.trim()) return;
    this.invoiceService.cancelInvoice(inv.public_id, this.cancelReason).subscribe({
      next: () => {
        this.showCancelForm.set(false);
        this.cancelReason = '';
        this.loadInvoice(inv.public_id);
      }
    });
  }

  onDelete() {
    const inv = this.invoice();
    if (!inv) return;
    this.alertDialogService.confirm({
      zTitle: 'Delete Invoice',
      zDescription: `Are you sure you want to delete ${inv.invoice_number}? This action cannot be undone.`,
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.invoiceService.deleteInvoice(inv.public_id).subscribe({
          next: () => this.router.navigate(['/e-invoices'])
        });
      }
    });
  }

  onDownloadPdf() {
    const inv = this.invoice();
    if (!inv) return;
    this.invoiceService.downloadPdf(inv.public_id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${inv.invoice_number}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  onPrint(event: Event) {
    event.stopPropagation();
    this.printPreview.set(true);
    setTimeout(() => window.print(), 300);
  }

  // ─── Payments ────────────────────────────────────────────

  onOpenPaymentDialog() {
    const inv = this.invoice();
    if (!inv) return;
    this.dialogService.create({
      zContent: PaymentDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zWidth: '480px',
      zCustomClasses: 'p-0 gap-0 overflow-hidden rounded-xl',
      zData: {
        invoice: inv,
        onSuccess: () => this.loadInvoice(inv.public_id)
      }
    });
  }

  onDeletePayment(payment: InvoicePayment) {
    const inv = this.invoice();
    if (!inv) return;
    this.alertDialogService.confirm({
      zTitle: 'Remove Payment',
      zDescription: `Remove payment of RM ${this.formatCurrency(payment.amount)}?`,
      zOkText: 'Remove',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.invoiceService.deletePayment(inv.public_id, payment.id).subscribe({
          next: () => this.loadInvoice(inv.public_id)
        });
      }
    });
  }

  // ─── Navigation ──────────────────────────────────────────

  navigateToEdit() {
    const inv = this.invoice();
    if (!inv) return;
    this.dialogService.create({
      zContent: InvoiceFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        invoice: inv,
        onSuccess: (updated: any) => {
          this.loadInvoice(updated.public_id || inv.public_id);
        }
      }
    });
  }

  navigateBack() {
    this.router.navigate(['/e-invoices']);
  }

  // ─── Activity Log ────────────────────────────────────────

  private buildActivityLog(inv: Invoice): ActivityEvent[] {
    const events: ActivityEvent[] = [];

    // Payments (most recent first)
    if (inv.payments?.length) {
      for (const p of [...inv.payments].reverse()) {
        events.push({
          icon: 'credit-card',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          title: `Payment of ${inv.currency} ${this.formatCurrency(p.amount)} recorded`,
          actor: p.recorder?.email,
          timestamp: this.formatDateTime(p.created_at)
        });
      }
    }

    // Cancelled
    if (inv.cancelled_at) {
      events.push({
        icon: 'ban',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        title: 'Invoice was cancelled by',
        actor: inv.canceller?.email,
        timestamp: this.formatDateTime(inv.cancelled_at)
      });
    }

    // LHDN validated
    if (inv.lhdn_validated_at) {
      events.push({
        icon: 'shield-check',
        iconBg: inv.status === 'Valid' ? 'bg-emerald-100' : 'bg-red-100',
        iconColor: inv.status === 'Valid' ? 'text-emerald-600' : 'text-red-600',
        title: inv.status === 'Invalid' ? 'Invoice validation failed' : 'Invoice validated by LHDN',
        timestamp: this.formatDateTime(inv.lhdn_validated_at)
      });
    }

    // LHDN submitted
    if (inv.lhdn_submitted_at) {
      events.push({
        icon: 'send',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'Invoice submitted to LHDN',
        timestamp: this.formatDateTime(inv.lhdn_submitted_at)
      });
    }

    // Approved
    if (inv.approved_at) {
      events.push({
        icon: 'check-circle',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        title: 'Invoice was approved by',
        actor: inv.approver?.email,
        timestamp: this.formatDateTime(inv.approved_at)
      });
    }

    // Created
    events.push({
      icon: 'file-plus',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Invoice was created by',
      actor: inv.creator?.email,
      timestamp: this.formatDateTime(inv.created_at)
    });

    return events;
  }

  getLastPaymentDate(inv: Invoice): string | null {
    if (!inv.payments?.length) return null;
    const sorted = [...inv.payments].sort((a, b) =>
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
    return sorted[0].payment_date;
  }

  // ─── Helpers ─────────────────────────────────────────────

  formatCurrency(amount: number | string): string {
    return parseFloat(String(amount || 0)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDateLong(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatDateTime(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getTypeLabel(type: string): string {
    return this.TYPE_LABELS[type] || type;
  }

  getStatusColor(status: string): string {
    return this.STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  }

  canEdit(): boolean {
    const s = this.invoice()?.status;
    return s === 'Draft' || s === 'Invalid' || s === 'Recorded';
  }

  canApprove(): boolean {
    return this.invoice()?.status === 'Draft';
  }

  canSubmit(): boolean {
    return this.invoice()?.status === 'Pending';
  }

  canCheckStatus(): boolean {
    return this.invoice()?.status === 'Submitted';
  }

  canCancel(): boolean {
    return this.invoice()?.status === 'Valid';
  }

  canRecordPayment(): boolean {
    const s = this.invoice()?.status;
    return (s === 'Valid' || s === 'Pending' || s === 'Submitted' || s === 'Recorded') && parseFloat(String(this.invoice()?.balance_due || 0)) > 0;
  }

  canDelete(): boolean {
    const s = this.invoice()?.status;
    return s === 'Draft' || s === 'Recorded';
  }
}
