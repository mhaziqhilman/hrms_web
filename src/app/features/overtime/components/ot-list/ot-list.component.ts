import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { AuthService } from '../../../../core/services/auth.service';
import { OvertimeService } from '../../services/overtime.service';
import { Overtime, OvertimeStatus, OvertimeDayType, DAY_TYPE_LABELS } from '../../models/overtime.model';
import { OtFormDialogComponent } from '../ot-form-dialog/ot-form-dialog.component';

type StatusFilter = 'all' | OvertimeStatus;

@Component({
  selector: 'app-ot-list',
  standalone: true,
  imports: [CommonModule, ZardSelectComponent, ZardSelectItemComponent],
  templateUrl: './ot-list.component.html',
  styleUrls: ['./ot-list.component.css']
})
export class OtListComponent implements OnInit {
  private auth = inject(AuthService);
  private overtimeService = inject(OvertimeService);
  private dialogService = inject(ZardDialogService);

  readonly dayTypeLabels = DAY_TYPE_LABELS;
  readonly pageSize = 12;

  isPrivileged = false;
  loading = signal(false);
  allRows = signal<Overtime[]>([]);
  activeStatus = signal<StatusFilter>('all');
  search = signal('');
  dayTypeFilter = signal<'all' | OvertimeDayType>('all');
  processingId = signal<string | null>(null);
  page = signal(1);
  selected = signal<Set<string>>(new Set());

  stats = computed(() => {
    const rows = this.allRows();
    const by = (s: OvertimeStatus) => rows.filter(r => r.status === s).length;
    const hours = rows.reduce((sum, r) => sum + Number(r.hours || 0), 0);
    const payout = rows.filter(r => r.status === 'Approved').reduce((sum, r) => sum + Number(r.amount || 0), 0);

    // distinct ISO-ish weeks present, for avg/week
    const weeks = new Set(rows.map(r => this.weekKey(r.date)));
    const avgWeek = weeks.size > 0 ? Math.round((hours / weeks.size) * 10) / 10 : 0;

    const byType: Record<string, number> = {};
    rows.forEach(r => { byType[r.day_type] = (byType[r.day_type] || 0) + Number(r.hours || 0); });
    let topType: OvertimeDayType | null = null; let topHours = 0;
    (Object.keys(byType) as OvertimeDayType[]).forEach(k => { if (byType[k] > topHours) { topHours = byType[k]; topType = k; } });
    const topPct = hours > 0 && topHours > 0 ? Math.round((topHours / hours) * 100) : 0;

    return {
      requested: rows.length,
      approved: by('Approved'),
      rejected: by('Rejected'),
      pending: by('Pending'),
      totalHours: Math.round(hours * 10) / 10,
      payout,
      avgWeek,
      topType,
      topPct
    };
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const status = this.activeStatus();
    const dt = this.dayTypeFilter();
    return this.allRows().filter(r => {
      if (status !== 'all' && r.status !== status) return false;
      if (dt !== 'all' && r.day_type !== dt) return false;
      if (q) {
        const hay = `${r.employee?.full_name || ''} ${r.reason || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    const role = this.auth.getCurrentUserValue()?.role ?? '';
    this.isPrivileged = ['super_admin', 'admin', 'manager'].includes(role);
    this.load();
  }

  private weekKey(date: string): string {
    const d = new Date(`${date}T00:00:00Z`);
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${week}`;
  }

  load(): void {
    this.loading.set(true);
    this.overtimeService.getAllOvertime({ limit: 200 }).subscribe({
      next: (res) => { this.allRows.set(res.data ?? []); this.loading.set(false); },
      error: () => { this.allRows.set([]); this.loading.set(false); }
    });
  }

  onSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); this.page.set(1); }
  setStatus(value: StatusFilter): void { this.activeStatus.set(value); this.page.set(1); }
  onDayTypeSelect(value: string): void { this.dayTypeFilter.set(value as 'all' | OvertimeDayType); this.page.set(1); }
  goToPage(p: number): void { if (p >= 1 && p <= this.totalPages()) this.page.set(p); }

  // Selection (page-scoped)
  isSelected(row: Overtime): boolean { return !!row.public_id && this.selected().has(row.public_id); }
  toggleSelect(row: Overtime): void {
    if (!row.public_id) return;
    const set = new Set(this.selected());
    set.has(row.public_id) ? set.delete(row.public_id) : set.add(row.public_id);
    this.selected.set(set);
  }
  allPageSelected = computed(() => {
    const rows = this.paged().filter(r => r.public_id);
    return rows.length > 0 && rows.every(r => this.selected().has(r.public_id!));
  });
  toggleSelectAll(): void {
    const rows = this.paged().filter(r => r.public_id);
    const set = new Set(this.selected());
    const all = rows.every(r => set.has(r.public_id!));
    rows.forEach(r => all ? set.delete(r.public_id!) : set.add(r.public_id!));
    this.selected.set(set);
  }
  selectedCount = computed(() => this.selected().size);
  clearSelection(): void { this.selected.set(new Set()); }

  private selectedPendingRows(): Overtime[] {
    const ids = this.selected();
    return this.allRows().filter(r => r.public_id && ids.has(r.public_id) && r.status === 'Pending');
  }

  approveSelected(): void {
    const rows = this.selectedPendingRows();
    if (!rows.length) { toast.info('No pending requests selected'); return; }
    let done = 0;
    rows.forEach(row => this.overtimeService.approval(row.public_id!, { action: 'approve' }).subscribe({
      next: (res) => { this.updateRow(res.data); if (++done === rows.length) { toast.success(`${rows.length} request(s) approved`); this.clearSelection(); } },
      error: () => { if (++done === rows.length) { this.load(); this.clearSelection(); } }
    }));
  }

  rejectSelected(): void {
    const rows = this.selectedPendingRows();
    if (!rows.length) { toast.info('No pending requests selected'); return; }
    const reason = prompt(`Reason for rejecting ${rows.length} request(s):`);
    if (!reason) return;
    let done = 0;
    rows.forEach(row => this.overtimeService.approval(row.public_id!, { action: 'reject', rejection_reason: reason }).subscribe({
      next: (res) => { this.updateRow(res.data); if (++done === rows.length) { toast.success(`${rows.length} request(s) rejected`); this.clearSelection(); } },
      error: () => { if (++done === rows.length) { this.load(); this.clearSelection(); } }
    }));
  }

  openForm(): void {
    this.dialogService.create({
      zContent: OtFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: true,
      zWidth: '440px',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-0 !top-0 !bottom-0 !translate-x-0 !translate-y-0 !max-w-none h-screen rounded-none shadow-2xl',
      zData: { onSuccess: () => this.load() }
    });
  }

  approve(row: Overtime): void {
    if (!row.public_id) return;
    this.processingId.set(row.public_id);
    this.overtimeService.approval(row.public_id, { action: 'approve' }).subscribe({
      next: (res) => { this.updateRow(res.data); this.processingId.set(null); toast.success('Overtime approved'); },
      error: (err) => { this.processingId.set(null); toast.error(err?.error?.message || 'Failed to approve'); }
    });
  }

  reject(row: Overtime): void {
    if (!row.public_id) return;
    const reason = prompt('Reason for rejecting this overtime request:');
    if (!reason) return;
    this.processingId.set(row.public_id);
    this.overtimeService.approval(row.public_id, { action: 'reject', rejection_reason: reason }).subscribe({
      next: (res) => { this.updateRow(res.data); this.processingId.set(null); toast.success('Overtime rejected'); },
      error: (err) => { this.processingId.set(null); toast.error(err?.error?.message || 'Failed to reject'); }
    });
  }

  approveAllPending(): void {
    const pending = this.allRows().filter(r => r.status === 'Pending' && r.public_id);
    if (pending.length === 0) { toast.info('No pending requests to approve'); return; }
    if (!confirm(`Approve all ${pending.length} pending overtime request(s)?`)) return;
    let done = 0;
    pending.forEach(row => {
      this.overtimeService.approval(row.public_id!, { action: 'approve' }).subscribe({
        next: (res) => { this.updateRow(res.data); if (++done === pending.length) toast.success(`${pending.length} request(s) approved`); },
        error: () => { if (++done === pending.length) this.load(); }
      });
    });
  }

  remove(row: Overtime): void {
    if (!row.public_id || !confirm('Delete this overtime request?')) return;
    this.overtimeService.deleteOvertime(row.public_id).subscribe({
      next: () => { this.allRows.set(this.allRows().filter(r => r.public_id !== row.public_id)); toast.success('Deleted'); }
    });
  }

  exportCsv(): void {
    const rows = this.filtered();
    const header = ['Employee', 'Employee ID', 'OT Date', 'Day Type', 'Time', 'Hours', 'Amount (RM)', 'Status', 'Reason'];
    const lines = rows.map(r => [
      r.employee?.full_name || '', r.employee?.employee_id || '', r.date,
      this.dayTypeLabels[r.day_type], this.timeRange(r), r.hours, r.amount, r.status,
      (r.reason || '').replace(/"/g, '""')
    ].map(c => `"${c}"`).join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'overtime.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  timeRange(row: Overtime): string {
    if (!row.start_time || !row.end_time) return '—';
    return `${row.start_time.slice(0, 5)}–${row.end_time.slice(0, 5)}`;
  }

  statusPill(status: OvertimeStatus): string {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900';
      case 'Rejected': return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 ring-1 ring-rose-100 dark:ring-rose-900';
      default: return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-900';
    }
  }

  durationLabel(row: Overtime): string {
    const h = Math.floor(Number(row.hours));
    const m = Math.round((Number(row.hours) - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }

  private updateRow(updated?: Overtime): void {
    if (!updated) return;
    this.allRows.set(this.allRows().map(r => r.public_id === updated.public_id ? updated : r));
  }
}
