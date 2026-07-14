import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';
import { MemoService } from '../../services/memo.service';
import { AuthService } from '@/core/services/auth.service';
import { Memo, MemoStatistics, MemoRecipient, MemoDepartmentStat } from '../../models/memo.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { AppDatePipe, AppDateTimePipe } from '@/shared/pipes/app-date.pipe';

type ReceiptFilter = 'all' | 'acknowledged' | 'pending';

@Component({
  selector: 'app-memo-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardButtonComponent,
    ZardIconComponent,
    ...ZardMenuImports,
    AppDatePipe,
    AppDateTimePipe
  ],
  templateUrl: './memo-viewer.html',
  styleUrl: './memo-viewer.css',
})
export class MemoViewerComponent implements OnInit {
  private authService = inject(AuthService);
  private alertDialogService = inject(ZardAlertDialogService);

  memo = signal<Memo | null>(null);
  statistics = signal<MemoStatistics | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  acknowledging = signal(false);
  loadingStatistics = signal(false);
  sendingReminder = signal(false);

  canEdit = signal(false);
  canDelete = signal(false);
  canViewStatistics = signal(false);
  hasAcknowledged = signal(false);

  // Acknowledgment table UI state
  receiptSearch = signal('');
  receiptFilter = signal<ReceiptFilter>('all');

  private currentUser: any = null;
  private currentMemoId: string | null = null;

  // ── Engagement figures ────────────────────────────────────────────────
  /** Distinct views recorded for the memo. */
  viewCount = computed(() => this.statistics()?.total_reads ?? this.memo()?.view_count ?? 0);

  /** Total audience expected to acknowledge. */
  targetCount = computed(() => this.statistics()?.target_count ?? 0);

  /** Completed acknowledgments. */
  ackCount = computed(
    () => this.statistics()?.total_acknowledgments ?? this.memo()?.acknowledgment_count ?? 0
  );

  /** Audience members still pending (never negative). */
  pendingCount = computed(() => Math.max(0, this.targetCount() - this.ackCount()));

  /** Acknowledgment completion %, clamped to 0–100. */
  ackPercent = computed(() => this.pct(this.ackCount(), this.targetCount()));

  /** Integer part of the completion % — drives the ring centre figure. */
  ackPercentWhole = computed(() => Math.floor(this.ackPercent()));

  /** Two-decimal fractional tail (".33") for the ring centre, or '' when whole. */
  ackPercentFraction = computed(() => {
    const frac = this.ackPercent() - this.ackPercentWhole();
    if (frac <= 0) return '';
    return ('.' + frac.toFixed(2).slice(2)).replace(/0+$/, '').replace(/\.$/, '');
  });

  /** Per-department acknowledgment breakdown. */
  byDepartment = computed<MemoDepartmentStat[]>(() => this.statistics()?.by_department ?? []);

  /** Estimated read time in minutes from the memo body (≈200 wpm, min 1). */
  readTime = computed(() => {
    const html = this.memo()?.content ?? '';
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  });

  // ── Acknowledgment table ──────────────────────────────────────────────
  private recipients = computed<MemoRecipient[]>(() => this.statistics()?.recipients ?? []);

  acknowledgedRecipientCount = computed(
    () => this.recipients().filter((r) => r.acknowledged_at).length
  );
  pendingRecipientCount = computed(
    () => this.recipients().filter((r) => !r.acknowledged_at).length
  );

  /** Recipients after applying the search box + status tab. */
  filteredRecipients = computed<MemoRecipient[]>(() => {
    const query = this.receiptSearch().trim().toLowerCase();
    const filter = this.receiptFilter();
    return this.recipients().filter((r) => {
      if (filter === 'acknowledged' && !r.acknowledged_at) return false;
      if (filter === 'pending' && r.acknowledged_at) return false;
      if (query) {
        const haystack = `${r.employee?.full_name ?? ''} ${r.employee?.department ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memoService: MemoService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentMemoId = id;
      this.loadMemo(id);
    }
  }

  loadMemo(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.hasAcknowledged.set(false);

    this.memoService.getMemoById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.memo.set(response.data);
          this.hasAcknowledged.set(this.computeHasAcknowledged(response.data));

          const role = this.currentUser?.role;
          const isAdmin = ['super_admin', 'admin'].includes(role);
          const isAuthor = response.data.author_id === this.currentUser?.id;

          this.canEdit.set(isAdmin || isAuthor);
          this.canDelete.set(isAdmin || isAuthor);
          this.canViewStatistics.set(isAdmin || isAuthor);

          if (this.canViewStatistics()) {
            this.loadStatistics(id);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load memo. Please try again.');
        this.loading.set(false);
        console.error('Error loading memo:', err);
      }
    });
  }

  /**
   * True when the signed-in user already has an acknowledged read receipt for
   * this memo. Keeps the CTA in sync after a refresh or re-navigation.
   */
  private computeHasAcknowledged(memo: Memo): boolean {
    const employeeId = this.currentUser?.employee?.id;
    if (!employeeId) return false;
    return (memo.read_receipts ?? []).some(
      (r) => r.employee_id === employeeId && !!r.acknowledged_at
    );
  }

  loadStatistics(id: string | number): void {
    this.loadingStatistics.set(true);

    this.memoService.getMemoStatistics(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.statistics.set(response.data);
        }
        this.loadingStatistics.set(false);
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.loadingStatistics.set(false);
      }
    });
  }

  acknowledgeMemo(): void {
    const memoId = this.memo()?.public_id;
    if (!memoId) return;

    this.acknowledging.set(true);

    this.memoService.acknowledgeMemo(memoId).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasAcknowledged.set(true);
          toast.success(response.message || 'Memo acknowledged');
          if (this.currentMemoId) this.loadMemo(this.currentMemoId);
        }
        this.acknowledging.set(false);
      },
      error: (err) => {
        const msg: string = err?.error?.message ?? '';
        if (err?.status === 400 && /already acknowledged/i.test(msg)) {
          this.hasAcknowledged.set(true);
          toast.info(msg || 'You have already acknowledged this memo');
          if (this.currentMemoId) this.loadMemo(this.currentMemoId);
        } else {
          toast.error(msg || 'Failed to acknowledge memo. Please try again.');
          console.error('Error acknowledging memo:', err);
        }
        this.acknowledging.set(false);
      }
    });
  }

  /** Send an acknowledgment reminder to everyone still pending. */
  sendReminder(): void {
    const memoId = this.memo()?.public_id;
    if (!memoId || this.sendingReminder()) return;

    this.sendingReminder.set(true);

    this.memoService.remindPending(memoId).subscribe({
      next: (response) => {
        if (response.success) {
          toast.success(response.message || 'Reminder sent');
        }
        this.sendingReminder.set(false);
      },
      error: (err) => {
        toast.error(err?.error?.message || 'Failed to send reminder. Please try again.');
        this.sendingReminder.set(false);
        console.error('Error sending reminder:', err);
      }
    });
  }

  deleteMemo(): void {
    const memoId = this.memo()?.public_id;
    if (!memoId) return;

    this.alertDialogService.confirm({
      zTitle: 'Delete Memo',
      zDescription: 'Are you sure you want to delete this memo? This action cannot be undone.',
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.memoService.deleteMemo(memoId).subscribe({
          next: (response) => {
            if (response.success) {
              toast.success(response.message || 'Memo deleted');
              this.router.navigate(['/communication/memos']);
            }
          },
          error: (err) => {
            toast.error(err?.error?.message || 'Failed to delete memo. Please try again.');
            console.error('Error deleting memo:', err);
          }
        });
      }
    });
  }

  publishMemo(): void {
    const memoId = this.memo()?.public_id;
    if (!memoId) return;

    this.memoService.publishMemo(memoId).subscribe({
      next: (response) => {
        if (response.success) {
          toast.success(response.message || 'Memo published');
          if (this.currentMemoId) this.loadMemo(this.currentMemoId);
        }
      },
      error: (err) => {
        toast.error(err?.error?.message || 'Failed to publish memo. Please try again.');
        console.error('Error publishing memo:', err);
      }
    });
  }

  archiveMemo(): void {
    const memoId = this.memo()?.public_id;
    if (!memoId) return;

    this.alertDialogService.confirm({
      zTitle: 'Archive Memo',
      zDescription: 'Are you sure you want to archive this memo?',
      zOkText: 'Archive',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.memoService.archiveMemo(memoId).subscribe({
          next: (response) => {
            if (response.success) {
              toast.success(response.message || 'Memo archived');
              if (this.currentMemoId) this.loadMemo(this.currentMemoId);
            }
          },
          error: (err) => {
            toast.error(err?.error?.message || 'Failed to archive memo. Please try again.');
            console.error('Error archiving memo:', err);
          }
        });
      }
    });
  }

  // ── Acknowledgment table controls ─────────────────────────────────────
  onReceiptSearch(value: string): void {
    this.receiptSearch.set(value);
  }

  setReceiptFilter(filter: ReceiptFilter): void {
    this.receiptFilter.set(filter);
  }

  // ── Presentation helpers ──────────────────────────────────────────────
  isExpired(): boolean {
    const memo = this.memo();
    if (!memo || !memo.expires_at) return false;
    return new Date(memo.expires_at) < new Date();
  }

  goBack(): void {
    this.router.navigate(['/communication/memos']);
  }

  /** Clamped percentage helper. */
  private pct(part: number, whole: number): number {
    if (!whole || whole <= 0) return 0;
    return Math.min(100, Math.max(0, (part / whole) * 100));
  }

  /** Per-department acknowledgment percentage (for the "By team" bars). */
  departmentPercent(dept: MemoDepartmentStat): number {
    return this.pct(dept.acknowledged, dept.total);
  }

  /** Extract up to 2 initials from a name (falls back to first 2 letters of email). */
  getInitials(input: string | null | undefined): string {
    if (!input) return '··';
    const source = input.includes('@') ? input.split('@')[0] : input;
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return source.slice(0, 2).toUpperCase();
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? '');
    return (first + last).toUpperCase();
  }

  /** Pick a stable avatar gradient for a person based on their name. */
  getAvatarGradient(input: string | null | undefined): string {
    const palette = [
      'from-violet-500 to-violet-700',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
      'from-emerald-500 to-emerald-700',
      'from-sky-500 to-sky-700',
      'from-fuchsia-500 to-fuchsia-700',
      'from-indigo-500 to-indigo-700',
      'from-teal-500 to-teal-700',
    ];
    if (!input) return palette[0];
    let hash = 0;
    for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) | 0;
    return palette[Math.abs(hash) % palette.length];
  }

  /** Tailwind classes for the priority pill. */
  priorityPillClass(priority: string | undefined): string {
    switch (priority) {
      case 'Urgent': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
      case 'High': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      case 'Low': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
      default: return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
    }
  }

  /** Tailwind classes for the status pill. */
  statusPillClass(status: string | undefined): string {
    switch (status) {
      case 'Published': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'Draft': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  /** Dot colour matching the status pill. */
  statusDotClass(status: string | undefined): string {
    switch (status) {
      case 'Published': return 'bg-emerald-500';
      case 'Draft': return 'bg-amber-500';
      default: return 'bg-slate-400 dark:bg-slate-500';
    }
  }
}
