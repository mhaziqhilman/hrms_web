import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { Bill, BillStatus, BillType } from '../../models/finance.model';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { BillFormDialogComponent } from '../bill-form-dialog/bill-form-dialog.component';

type BadgeType = 'soft-gray' | 'soft-blue' | 'soft-purple' | 'soft-yellow' | 'soft-green' | 'soft-red';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardTableImports,
    ZardDividerComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './bill-list.component.html'
})
export class BillListComponent implements OnInit {
  private financeService = inject(FinanceService);
  private router = inject(Router);
  private dialogService = inject(ZardDialogService);

  loading = signal(true);
  bills = signal<Bill[]>([]);
  pagination = signal({ page: 1, limit: 15, totalItems: 0, totalPages: 0 });

  statusFilter = signal<BillStatus | ''>('');
  typeFilter = signal<BillType | ''>('');
  searchTerm = signal('');
  fromDate = signal('');
  toDate = signal('');
  fromDateValue: Date | null = null;
  toDateValue: Date | null = null;
  private searchTimeout: any;

  statuses: BillStatus[] = ['Draft', 'Approved', 'Received', 'Partial_Paid', 'Paid', 'Cancelled'];
  types: BillType[] = ['PO', 'Bill', 'Expense'];

  hasActiveFilters = computed(() =>
    !!(this.statusFilter() || this.typeFilter() || this.searchTerm() || this.fromDate() || this.toDate())
  );

  pageRange = computed(() => {
    const total = this.pagination().totalPages;
    const max = 5;
    return Array.from({ length: Math.min(total, max) }, (_, i) => i + 1);
  });

  ngOnInit() { this.load(1); }

  load(page = 1) {
    this.loading.set(true);
    this.financeService.listBills({
      page, limit: 15,
      status: this.statusFilter() || undefined,
      bill_type: this.typeFilter() || undefined,
      search: this.searchTerm() || undefined,
      date_from: this.fromDate() || undefined,
      date_to: this.toDate() || undefined,
      sort: 'bill_date',
      order: 'DESC'
    }).subscribe({
      next: res => {
        this.bills.set(res.data.bills);
        this.pagination.set(res.data.pagination);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(1), 350);
  }

  setStatus(s: BillStatus | '') {
    this.statusFilter.set(s);
    this.load(1);
  }

  setType(t: BillType | '') {
    this.typeFilter.set(t);
    this.load(1);
  }

  onDateChange() {
    this.load(1);
  }

  onFromDateChange(date: Date | null) {
    this.fromDate.set(date ? this.toIsoDate(date) : '');
    this.load(1);
  }

  onToDateChange(date: Date | null) {
    this.toDate.set(date ? this.toIsoDate(date) : '');
    this.load(1);
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  resetFilters() {
    this.statusFilter.set('');
    this.typeFilter.set('');
    this.searchTerm.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.fromDateValue = null;
    this.toDateValue = null;
    this.load(1);
  }

  goToDetail(b: Bill) {
    this.router.navigate(['/finance/bills', b.public_id]);
  }

  goToCreate() {
    this.dialogService.create({
      zContent: BillFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        onSuccess: (bill: Bill) => {
          this.load(this.pagination().page);
          this.router.navigate(['/finance/bills', bill.public_id]);
        }
      }
    });
  }

  goToEdit(b: Bill, ev?: MouseEvent) {
    if (ev) ev.stopPropagation();
    this.financeService.getBill(b.public_id).subscribe({
      next: res => {
        if (!res.success) return;
        this.dialogService.create({
          zContent: BillFormDialogComponent,
          zHideFooter: true,
          zClosable: false,
          zMaskClosable: false,
          zWidth: '70vw',
          zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
          zData: {
            bill: res.data,
            onSuccess: () => this.load(this.pagination().page)
          }
        });
      }
    });
  }

  formatMoney(v: number | string | null | undefined): string {
    if (v == null || v === '') return '—';
    return `RM ${(+v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  badgeType(status: BillStatus): BadgeType {
    switch (status) {
      case 'Draft': return 'soft-gray';
      case 'Approved': return 'soft-blue';
      case 'Received': return 'soft-purple';
      case 'Partial_Paid': return 'soft-yellow';
      case 'Paid': return 'soft-green';
      case 'Cancelled': return 'soft-red';
    }
  }

  statusDot(status: BillStatus): string {
    switch (status) {
      case 'Draft': return 'bg-slate-400';
      case 'Approved': return 'bg-blue-500';
      case 'Received': return 'bg-purple-500';
      case 'Partial_Paid': return 'bg-yellow-500';
      case 'Paid': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
    }
  }

  typeBadgeType(type: BillType): BadgeType {
    switch (type) {
      case 'PO': return 'soft-blue';
      case 'Bill': return 'soft-purple';
      case 'Expense': return 'soft-yellow';
    }
  }
}
