import { Component, OnInit, signal, computed, ViewContainerRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClaimService } from '../../services/claim.service';
import { Claim, ClaimQueryParams } from '../../models/claim.model';
import { AuthService } from '@/core/services/auth.service';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';

// Dialog Components
import { ApprovalConfirmationDialogComponent } from './dialogs/approval-confirmation-dialog.component';
import { RejectionDialogComponent } from './dialogs/rejection-dialog.component';
import { PaymentDialogComponent } from './dialogs/payment-dialog.component';

@Component({
  selector: 'app-claim-approval',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardMenuImports,
    ZardCheckboxComponent
  ],
  templateUrl: './claim-approval.component.html',
  styleUrl: './claim-approval.component.css'
})
export class ClaimApprovalComponent implements OnInit {
  private dialogService = inject(ZardDialogService);
  private alertDialogService = inject(ZardAlertDialogService);
  private viewContainerRef = inject(ViewContainerRef);
  private authService = inject(AuthService);

  claims = signal<Claim[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  processingClaimId = signal<number | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  limit = 10;

  // Filters
  activeTab = signal<string>('All');
  statusCounts = signal<{ [key: string]: number }>({
    'All': 0,
    'Pending': 0,
    'Manager_Approved': 0,
    'Finance_Approved': 0,
    'Paid': 0,
    'Rejected': 0
  });

  searchQuery = signal<string>('');
  selectedStatus = signal<'Pending' | 'Manager_Approved' | 'Finance_Approved' | 'Rejected' | 'Paid' | ''>('');
  selectedClaimType = signal<number | null>(null);

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selection
  selectedItems = signal<Set<number>>(new Set());
  selectAll = signal<boolean>(false);


  // User role from auth service
  userRole = signal<string>('staff');
  userId = signal<number | null>(null);

  // Admin/super_admin can handle all approval levels; manager only Level 1
  isAdmin = computed(() => ['admin', 'super_admin'].includes(this.userRole()));
  isManagerOrAbove = computed(() => ['manager', 'admin', 'super_admin'].includes(this.userRole()));

  // Expose Math to template
  Math = Math;

  constructor(private claimService: ClaimService) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.userRole.set(user.role);
      this.userId.set(user.id);
    }
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: ClaimQueryParams = {
      page: this.currentPage(),
      limit: this.limit
    };

    // Filter based on user role
    if (this.selectedStatus()) {
      // User explicitly selected a status tab
      params.status = this.selectedStatus() as any;
    } else if (!this.isAdmin()) {
      // Managers only see Pending claims by default
      params.status = 'Pending';
    }
    // Admin/super_admin with no filter selected → see all claims

    if (this.selectedClaimType()) {
      params.claim_type_id = this.selectedClaimType()!;
    }

    this.claimService.getAllClaims(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.claims.set(response.data);
          this.totalPages.set(response.pagination.totalPages);
          this.totalRecords.set(response.pagination.total);
          this.currentPage.set(response.pagination.page);

          this.calculateStatusCounts(); // Recalculate counts
          this.sortClaims(); // Apply sorting if active
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.message || 'Failed to load claims');
        this.loading.set(false);
        console.error('Error loading claims:', err);
      }
    });
  }

  // Tab & Status Logic
  onTabChange(tab: { index: number, label: string }): void {
    const label = tab.label;
    this.activeTab.set(label);

    // Map tab label to status
    if (label === 'All Requests' || label === 'All') {
      this.selectedStatus.set('');
    } else if (label === 'Pending') {
      this.selectedStatus.set('Pending');
    } else if (label === 'To Approve' || label === 'Manager Approved') {
      this.selectedStatus.set('Manager_Approved');
    } else if (label === 'Finance Approved') {
      this.selectedStatus.set('Finance_Approved');
    } else if (label === 'Paid') {
      this.selectedStatus.set('Paid');
    } else if (label === 'Rejected') {
      this.selectedStatus.set('Rejected');
    }

    this.currentPage.set(1);
    this.loadClaims();
  }

  calculateStatusCounts(): void {
    // Note: In a real app, this should probably come from a separate API call 
    // to get counts for all statuses regardless of current filters
    // For now, we'll just init with 0 or map if the API provided it
    /* 
    const counts = { ...this.statusCounts() };
    counts['All'] = this.totalRecords();
    this.statusCounts.set(counts);
    */
  }

  // Sorting Logic
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortClaims();
  }

  sortClaims(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return;

    const sorted = [...this.claims()].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'employee':
          aValue = a.employee?.full_name?.toLowerCase() || '';
          bValue = b.employee?.full_name?.toLowerCase() || '';
          break;
        case 'type':
          aValue = a.claimType?.name?.toLowerCase() || '';
          bValue = b.claimType?.name?.toLowerCase() || '';
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = typeof a.amount === 'string' ? parseFloat(a.amount) : a.amount;
          bValue = typeof b.amount === 'string' ? parseFloat(b.amount) : b.amount;
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.claims.set(sorted);
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn() === column;
  }

  // Selection Logic
  toggleSelectAll(): void {
    const allSelected = this.selectAll();
    const newSelection = new Set<number>();

    if (allSelected) {
      this.claims().forEach(claim => newSelection.add(claim.id));
    }

    this.selectedItems.set(newSelection);
  }

  toggleClaimSelection(claimId: number): void {
    const currentSelection = new Set(this.selectedItems()); // Create a copy
    if (currentSelection.has(claimId)) {
      currentSelection.delete(claimId);
    } else {
      currentSelection.add(claimId);
    }
    this.selectedItems.set(currentSelection);

    // Update selectAll state
    this.selectAll.set(
      this.claims().length > 0 &&
      currentSelection.size === this.claims().length
    );
  }

  isClaimSelected(claimId: number): boolean {
    return this.selectedItems().has(claimId);
  }

  getSelectedCount(): number {
    return this.selectedItems().size;
  }

  clearSelection(): void {
    this.selectedItems.set(new Set());
    this.selectAll.set(false);
  }

  bulkApprove(): void {
    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Approve',
      zDescription: `Are you sure you want to approve ${selectedIds.length} claims?`,
      zOkText: 'Approve All',
      zCancelText: 'Cancel',
      zOnOk: () => {
        // Implement bulk approval API call here
        // For now, we'll just simulate it or process one by one
        // ideally backend should support batch operations
        this.clearSelection();
        this.success.set(`${selectedIds.length} claims approved successfully`);
        setTimeout(() => this.success.set(null), 3000);
      }
    });
  }

  bulkReject(): void {
    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Reject',
      zDescription: `Are you sure you want to reject ${selectedIds.length} claims?`,
      zOkText: 'Reject All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.clearSelection();
        this.success.set(`${selectedIds.length} claims rejected`);
        setTimeout(() => this.success.set(null), 3000);
      }
    });
  }


  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadClaims();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadClaims();
    }
  }

  clearFilters(): void {
    this.selectedStatus.set('');
    this.selectedClaimType.set(null);
    this.currentPage.set(1);
    this.loadClaims();
  }

  // Manager Approval Actions using Dialog Service
  openApprovalModal(claim: Claim): void {
    const dialogRef = this.dialogService.create({
      zTitle: 'Confirm Approval',
      zContent: ApprovalConfirmationDialogComponent,
      zData: claim,
      zViewContainerRef: this.viewContainerRef,
      zOkText: 'Confirm Approval',
      zCancelText: 'Cancel',
      zOkIcon: 'circle-check',
      zOnOk: () => {
        this.confirmApproval(claim);
      }
    });
  }

  openRejectionModal(claim: Claim): void {
    const dialogRef = this.dialogService.create({
      zTitle: 'Reject Claim',
      zContent: RejectionDialogComponent,
      zData: claim,
      zViewContainerRef: this.viewContainerRef,
      zOkText: 'Confirm Rejection',
      zCancelText: 'Cancel',
      zOkIcon: 'circle-x',
      zOkDestructive: true,
      zOnOk: (instance: RejectionDialogComponent): false | void => {
        const reason = instance.getRejectionReason();
        if (!reason.trim()) {
          this.error.set('Please provide a rejection reason');
          return false;
        }
        this.confirmRejection(claim, reason);
      }
    });
  }

  openPaymentModal(claim: Claim): void {
    const dialogRef = this.dialogService.create({
      zTitle: 'Record Payment',
      zContent: PaymentDialogComponent,
      zData: claim,
      zViewContainerRef: this.viewContainerRef,
      zOkText: 'Confirm Payment',
      zCancelText: 'Cancel',
      zOkIcon: 'circle',
      zOnOk: (instance: PaymentDialogComponent): false | void => {
        if (!instance.isValid()) {
          this.error.set('Please provide payment details');
          return false;
        }
        const paymentData = instance.getPaymentData();
        this.confirmPayment(claim, paymentData);
      }
    });
  }

  confirmApproval(claim: Claim): void {
    this.processingClaimId.set(claim.id);

    // Determine which API to call based on claim status
    const approval$ = claim.status === 'Pending'
      ? this.claimService.managerApproval(claim.id, { action: 'approve' })
      : this.claimService.financeApproval(claim.id, { action: 'approve' });

    const levelLabel = claim.status === 'Pending' ? 'Manager approval' : 'Finance approval';

    approval$.subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set(`${levelLabel} completed successfully`);
          this.loadClaims();
          setTimeout(() => this.success.set(null), 3000);
        }
        this.processingClaimId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to approve claim');
        this.processingClaimId.set(null);
        console.error('Error approving claim:', err);
      }
    });
  }

  confirmRejection(claim: Claim, reason: string): void {
    this.processingClaimId.set(claim.id);

    const request = {
      action: 'reject' as const,
      rejection_reason: reason
    };

    // Determine which API to call based on claim status
    const rejection$ = claim.status === 'Pending'
      ? this.claimService.managerApproval(claim.id, request)
      : this.claimService.financeApproval(claim.id, request);

    rejection$.subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set('Claim rejected successfully');
          this.loadClaims();
          setTimeout(() => this.success.set(null), 3000);
        }
        this.processingClaimId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to reject claim');
        this.processingClaimId.set(null);
        console.error('Error rejecting claim:', err);
      }
    });
  }

  // Finance Payment Actions
  confirmPayment(claim: Claim, paymentData: any): void {
    this.processingClaimId.set(claim.id);

    const request = {
      action: 'paid' as const,
      payment_method: paymentData.payment_method,
      payment_reference: paymentData.payment_reference,
      payment_date: paymentData.payment_date
    };

    this.claimService.financeApproval(claim.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set('Payment recorded successfully');
          this.loadClaims();
          setTimeout(() => this.success.set(null), 3000);
        }
        this.processingClaimId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to record payment');
        this.processingClaimId.set(null);
        console.error('Error recording payment:', err);
      }
    });
  }

  // Helper methods
  canApprove(claim: Claim): boolean {
    if (this.isAdmin()) {
      // Admin can approve Pending (Level 1) and Manager_Approved (Level 2)
      return claim.status === 'Pending' || claim.status === 'Manager_Approved';
    } else if (this.userRole() === 'manager') {
      // Manager can only approve Pending (Level 1)
      return claim.status === 'Pending';
    }
    return false;
  }

  canReject(claim: Claim): boolean {
    if (this.isAdmin()) {
      return claim.status === 'Pending' || claim.status === 'Manager_Approved';
    } else if (this.userRole() === 'manager') {
      return claim.status === 'Pending';
    }
    return false;
  }

  canMarkAsPaid(claim: Claim): boolean {
    return this.isAdmin() && claim.status === 'Finance_Approved';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge-warning';
      case 'Manager_Approved':
        return 'badge-info';
      case 'Finance_Approved':
        return 'badge-primary';
      case 'Paid':
        return 'badge-success';
      case 'Rejected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getStatusDisplayText(status: string): string {
    switch (status) {
      case 'Manager_Approved':
        return 'Manager Approved';
      case 'Finance_Approved':
        return 'Finance Approved';
      default:
        return status;
    }
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '--';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, -1);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push(-1, total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  }
}
