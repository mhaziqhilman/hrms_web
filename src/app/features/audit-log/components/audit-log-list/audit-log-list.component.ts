import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { TimeAgoPipe } from '@/shared/pipes/time-ago.pipe';

import { AuditLogService } from '../../services/audit-log.service';
import { AuditLog, AuditLogFilters } from '../../models/audit-log.model';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent,
    ZardSkeletonComponent,
    ZardTableImports,
    TimeAgoPipe
  ],
  templateUrl: './audit-log-list.component.html'
})
export class AuditLogListComponent implements OnInit {
  private auditLogService = inject(AuditLogService);

  loading = signal(true);
  logs = signal<AuditLog[]>([]);
  pagination = signal({ total: 0, currentPage: 1, limit: 20, totalPages: 0 });
  selectedLog = signal<AuditLog | null>(null);

  // Filters
  actionFilter = signal('');
  entityTypeFilter = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  private searchTimeout: any;

  readonly entityTypes = [
    'Leave', 'Claim', 'Payroll', 'Employee', 'Memo', 'Policy', 'Attendance'
  ];

  readonly actionPrefixes = [
    { value: 'leave', label: 'Leave' },
    { value: 'claim', label: 'Claim' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'employee', label: 'Employee' },
    { value: 'memo', label: 'Memo' },
    { value: 'policy', label: 'Policy' }
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(page = 1): void {
    this.loading.set(true);
    const filters: AuditLogFilters = { page, limit: 20 };
    if (this.actionFilter()) filters.action = this.actionFilter();
    if (this.entityTypeFilter()) filters.entity_type = this.entityTypeFilter();
    if (this.dateFrom()) filters.date_from = this.dateFrom();
    if (this.dateTo()) filters.date_to = this.dateTo();

    this.auditLogService.getAuditLogs(filters).subscribe({
      next: (res) => {
        if (res.success) {
          this.logs.set(res.data);
          if (res.pagination) this.pagination.set(res.pagination);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadLogs(1), 300);
  }

  clearFilters(): void {
    this.actionFilter.set('');
    this.entityTypeFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadLogs(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.loadLogs(page);
  }

  selectLog(log: AuditLog): void {
    this.selectedLog.set(this.selectedLog()?.id === log.id ? null : log);
  }

  getActionBadgeType(action: string): string {
    if (action.includes('approved') || action.includes('paid') || action.includes('created')) return 'default';
    if (action.includes('rejected') || action.includes('deactivated') || action.includes('deleted')) return 'destructive';
    return 'secondary';
  }

  getActionLabel(action: string): string {
    return action.replace(/\./g, ' › ').replace(/_/g, ' ');
  }

  getUserDisplay(log: AuditLog): string {
    return log.user?.employee?.full_name || log.user?.full_name || log.user?.email || `User #${log.user_id}`;
  }

  formatJson(obj: Record<string, any> | null): string {
    if (!obj) return '—';
    return JSON.stringify(obj, null, 2);
  }

  hasActiveFilters(): boolean {
    return !!(this.actionFilter() || this.entityTypeFilter() || this.dateFrom() || this.dateTo());
  }

  get pages(): number[] {
    const { currentPage, totalPages } = this.pagination();
    const range: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }
    return range;
  }

  pageEnd(): number {
    const { currentPage, limit, total } = this.pagination();
    return Math.min(currentPage * limit, total);
  }
}
