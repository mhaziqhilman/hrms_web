import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardTabGroupComponent, ZardTabComponent } from '@/shared/components/tabs/tabs.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';

import { EInvoiceService } from '../../services/e-invoice.service';
import { InvoiceFormDialogComponent } from '../invoice-form-dialog/invoice-form-dialog.component';
import {
  Invoice,
  InvoiceAnalytics,
  InvoiceListFilters,
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_COLORS
} from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardTableImports,
    ZardMenuImports,
    ZardDividerComponent,
    ZardCheckboxComponent,
    ZardTabGroupComponent,
    ZardTabComponent,
    ZardTooltipModule
  ],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private invoiceService = inject(EInvoiceService);
  private router = inject(Router);
  private alertDialogService = inject(ZardAlertDialogService);
  private dialogService = inject(ZardDialogService);

  // State
  loading = signal(true);
  tableLoading = signal(false);
  error = signal<string | null>(null);
  analytics = signal<InvoiceAnalytics | null>(null);
  invoices = signal<Invoice[]>([]);
  pagination = signal({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });

  // Filters
  searchTerm = '';
  activeStatus = '';
  typeFilter = '';
  dateFrom = '';
  dateTo = '';
  sortColumn = 'created_at';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  // Selection
  selectedInvoices = new Set<string>();
  allSelected = false;

  // Column visibility
  visibleColumns: Record<string, boolean> = {
    invoiceNumber: true,
    date: true,
    type: true,
    party: true,
    amount: true,
    status: true
  };

  // Debounce
  private searchTimeout: any;

  readonly TYPE_LABELS = INVOICE_TYPE_LABELS;
  readonly STATUS_COLORS = INVOICE_STATUS_COLORS;
  readonly statuses = ['Draft', 'Pending', 'Submitted', 'Valid', 'Invalid', 'Cancelled'];

  // Math reference for template
  readonly mathMin = Math.min;

  ngOnInit() {
    this.loadAnalytics();
    this.loadInvoices();
  }

  ngOnDestroy() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  // ─── Data Loading ────────────────────────────────────────

  loadAnalytics() {
    this.invoiceService.getAnalytics().subscribe({
      next: (res) => {
        if (res.success) this.analytics.set(res.data);
      },
      error: () => {}
    });
  }

  loadInvoices() {
    this.tableLoading.set(true);
    const filters: InvoiceListFilters = {
      page: this.pagination().page,
      limit: this.pagination().limit,
      sort: this.sortColumn,
      order: this.sortDirection
    };

    if (this.activeStatus) filters.status = this.activeStatus;
    if (this.typeFilter) filters.invoice_type = this.typeFilter;
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.dateFrom) filters.date_from = this.dateFrom;
    if (this.dateTo) filters.date_to = this.dateTo;

    this.invoiceService.getInvoices(filters).subscribe({
      next: (res) => {
        if (res.success) {
          this.invoices.set(res.data.invoices);
          this.pagination.set(res.data.pagination);
        }
        this.loading.set(false);
        this.tableLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load invoices');
        this.loading.set(false);
        this.tableLoading.set(false);
      }
    });
  }

  // ─── Tabs ─────────────────────────────────────────────────

  onTabChange(event: { index: number; label: string }) {
    const statusMap: Record<number, string> = {
      0: '',
      1: 'Draft',
      2: 'Pending',
      3: 'Submitted',
      4: 'Valid',
      5: 'Invalid',
      6: 'Cancelled'
    };
    this.activeStatus = statusMap[event.index] || '';
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadInvoices();
  }

  // ─── Column Visibility ────────────────────────────────────

  toggleColumn(column: string) {
    this.visibleColumns[column] = !this.visibleColumns[column];
  }

  // ─── Filters ─────────────────────────────────────────────

  onSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pagination.update(p => ({ ...p, page: 1 }));
      this.loadInvoices();
    }, 400);
  }

  onStatusFilter(status: string) {
    this.activeStatus = this.activeStatus === status ? '' : status;
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadInvoices();
  }

  onTypeFilter(type: string) {
    this.typeFilter = this.typeFilter === type ? '' : type;
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadInvoices();
  }

  onDateFilter() {
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadInvoices();
  }

  resetFilters() {
    this.searchTerm = '';
    this.activeStatus = '';
    this.typeFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadInvoices();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.typeFilter || this.dateFrom || this.dateTo);
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'DESC';
    }
    this.loadInvoices();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'chevrons-up-down';
    return this.sortDirection === 'ASC' ? 'chevron-up' : 'chevron-down';
  }

  onPageChange(page: number) {
    this.pagination.update(p => ({ ...p, page }));
    this.loadInvoices();
  }

  // ─── Selection ───────────────────────────────────────────

  toggleSelectAll() {
    if (this.allSelected) {
      this.invoices().forEach(inv => this.selectedInvoices.add(inv.public_id));
    } else {
      this.selectedInvoices.clear();
    }
  }

  toggleSelect(publicId: string) {
    if (this.selectedInvoices.has(publicId)) {
      this.selectedInvoices.delete(publicId);
    } else {
      this.selectedInvoices.add(publicId);
    }
    this.allSelected = this.selectedInvoices.size === this.invoices().length;
  }

  isSelected(publicId: string): boolean {
    return this.selectedInvoices.has(publicId);
  }

  // ─── Actions ─────────────────────────────────────────────

  navigateToCreate() {
    this.dialogService.create({
      zContent: InvoiceFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        onSuccess: (invoice: any) => {
          this.loadInvoices();
          this.loadAnalytics();
          this.router.navigate(['/e-invoices', invoice.public_id]);
        }
      }
    });
  }

  navigateToDetail(publicId: string) {
    this.router.navigate(['/e-invoices', publicId]);
  }

  navigateToEdit(publicId: string) {
    this.invoiceService.getInvoice(publicId).subscribe({
      next: (res) => {
        if (res.success) {
          this.dialogService.create({
            zContent: InvoiceFormDialogComponent,
            zHideFooter: true,
            zClosable: false,
            zMaskClosable: false,
            zWidth: '70vw',
            zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
            zData: {
              invoice: res.data,
              onSuccess: () => {
                this.loadInvoices();
                this.loadAnalytics();
              }
            }
          });
        }
      }
    });
  }

  onApprove(invoice: Invoice) {
    this.invoiceService.approveInvoice(invoice.public_id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadInvoices();
          this.loadAnalytics();
        }
      }
    });
  }

  onSubmitToLhdn(invoice: Invoice) {
    this.invoiceService.submitToLhdn(invoice.public_id).subscribe({
      next: () => {
        this.loadInvoices();
        this.loadAnalytics();
      }
    });
  }

  onDelete(invoice: Invoice) {
    this.alertDialogService.confirm({
      zTitle: 'Delete Invoice',
      zDescription: `Are you sure you want to delete ${invoice.invoice_number}? This action cannot be undone.`,
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.invoiceService.deleteInvoice(invoice.public_id).subscribe({
          next: () => {
            this.loadInvoices();
            this.loadAnalytics();
          }
        });
      }
    });
  }

  onBulkSubmit() {
    const ids = Array.from(this.selectedInvoices);
    this.invoiceService.bulkSubmit(ids).subscribe({
      next: (res) => {
        this.selectedInvoices.clear();
        this.allSelected = false;
        this.loadInvoices();
        this.loadAnalytics();
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────

  formatCurrency(amount: number | string): string {
    return parseFloat(String(amount || 0)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getTypeLabel(type: string): string {
    return this.TYPE_LABELS[type] || type;
  }

  getStatusColor(status: string): string {
    return this.STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  }

  getTotalCount(): number {
    const counts = this.analytics()?.statusCounts;
    if (!counts) return 0;
    return Object.values(counts).reduce((sum, c) => sum + c, 0);
  }

  getPageNumbers(): number[] {
    const { page, totalPages } = this.pagination();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
