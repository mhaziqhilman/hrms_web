import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { Bill } from '../../models/finance.model';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { BillFormDialogComponent } from '../bill-form-dialog/bill-form-dialog.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { AuthService } from '@/core/services/auth.service';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ZardButtonComponent],
  templateUrl: './bill-detail.component.html'
})
export class BillDetailComponent implements OnInit {
  private financeService = inject(FinanceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialogService = inject(ZardDialogService);
  private alertDialogService = inject(ZardAlertDialogService);
  private authService = inject(AuthService);

  /** Approve / Cancel / Record Payment / Delete are admin-only on the backend (requireAdmin). */
  isAdmin = this.authService.hasAnyRole(['super_admin', 'admin']);

  loading = signal(true);
  bill = signal<Bill | null>(null);
  showPaymentModal = signal(false);

  payment = {
    payment_date: new Date().toISOString().slice(0, 10),
    amount: 0,
    payment_method: 'Bank Transfer',
    reference_number: '',
    notes: ''
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string) {
    this.loading.set(true);
    this.financeService.getBill(id).subscribe({
      next: res => {
        this.bill.set(res.data);
        this.payment.amount = +res.data.balance_due;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  approve() {
    const b = this.bill();
    if (!b) return;
    this.financeService.approveBill(b.public_id).subscribe(() => this.load(b.public_id));
  }

  cancel() {
    const b = this.bill();
    if (!b) return;
    const reason = prompt('Cancellation reason:');
    if (reason === null) return;
    this.financeService.cancelBill(b.public_id, reason).subscribe(() => this.load(b.public_id));
  }

  edit() {
    const b = this.bill();
    if (!b) return;
    this.dialogService.create({
      zContent: BillFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        bill: b,
        onSuccess: () => this.load(b.public_id)
      }
    });
  }

  remove() {
    const b = this.bill();
    if (!b) return;
    this.alertDialogService.confirm({
      zTitle: 'Delete Bill',
      zDescription: `Delete ${b.bill_number}?`,
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.financeService.deleteBill(b.public_id).subscribe(() => {
          this.router.navigate(['/finance/bills']);
        });
      }
    });
  }

  openPaymentModal() {
    const b = this.bill();
    if (b) this.payment.amount = +b.balance_due;
    this.showPaymentModal.set(true);
  }

  recordPayment() {
    const b = this.bill();
    if (!b || this.payment.amount <= 0) return;
    this.financeService.recordPayment(b.public_id, this.payment).subscribe(() => {
      this.showPaymentModal.set(false);
      this.load(b.public_id);
    });
  }

  deletePayment(paymentId: number) {
    const b = this.bill();
    if (!b) return;
    this.alertDialogService.confirm({
      zTitle: 'Delete Payment',
      zDescription: 'Delete this payment? This will recompute the bill balance.',
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.financeService.deletePayment(b.public_id, paymentId).subscribe(() => this.load(b.public_id));
      }
    });
  }

  formatMoney(v: number | string | null | undefined): string {
    if (v == null) return '—';
    const cur = this.bill()?.currency || 'MYR';
    return `${cur} ${(+v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
