import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '@/core/services/auth.service';
import { PayrollService } from '@/features/payroll/services/payroll.service';
import { PayslipPdfService } from '@/features/payroll/services/payslip-pdf.service';
import type { Payroll } from '@/features/payroll/models/payroll.model';
import { toast } from 'ngx-sonner';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { NativeService } from '@/mobile/services/native.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import {
  MobileStatusBadgeComponent,
  MobileStatusTone,
} from '@/mobile/shared/mobile-status-badge.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
  selector: 'app-mobile-payslip',
  standalone: true,
  imports: [
    CommonModule,
    ZardIconComponent,
    MobilePageHeaderComponent,
    MobileStatusBadgeComponent,
    MobileEmptyStateComponent,
  ],
  template: `
    <section class="space-y-5">
      <app-mobile-page-header title="Payslips" subtitle="View and download your payslips" />

      @if (latest(); as p) {
        <div class="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-5 text-white shadow-xl shadow-emerald-500/20">
          <div class="flex items-center justify-between text-xs opacity-80">
            <span class="uppercase tracking-wider">Latest net pay</span>
            <span>{{ monthLabel(p.month, p.year) }}</span>
          </div>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-4xl font-bold tabular-nums">{{ p.net_salary | number:'1.2-2' }}</span>
            <span class="text-sm opacity-80">MYR</span>
          </div>
          <div class="mt-3 flex items-center gap-3 text-xs opacity-90">
            <div class="flex items-center gap-1.5"><z-icon zType="check" zSize="sm"></z-icon>{{ p.status }}</div>
            <div class="h-1 w-1 rounded-full bg-white/40"></div>
            <div>Paid {{ formatDate(p.payment_date) }}</div>
          </div>
          <button
            type="button"
            (click)="downloadPdf(p)"
            [disabled]="downloadingId() !== null"
            class="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-700 active:scale-95 transition disabled:opacity-70"
          >
            @if (downloadingId() === p.id) {
              <z-icon zType="loader-circle" zSize="sm" class="animate-spin"></z-icon>
              Preparing...
            } @else {
              <z-icon zType="download" zSize="sm"></z-icon>
              Download PDF
            }
          </button>
        </div>
      }

      <!-- History -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">History</h2>
          <span class="text-xs text-neutral-500 tabular-nums">{{ filtered().length }} payslip{{ filtered().length === 1 ? '' : 's' }}</span>
        </div>

        <!-- Year tabs -->
        @if (years().length > 0) {
          <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-3 no-scrollbar">
            @for (y of years(); track y) {
              <button
                type="button"
                (click)="setYear(y)"
                class="inline-flex items-center shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition"
                [class]="selectedYear() === y
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'"
              >
                {{ y }}
              </button>
            }
          </div>
        }

        @if (loading()) {
          <div class="space-y-2">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-16 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
            }
          </div>
        } @else if (all().length === 0) {
          <app-mobile-empty-state icon="wallet" title="No payslips yet" subtitle="Your payslips will appear here once processed." />
        } @else if (filtered().length === 0) {
          <app-mobile-empty-state icon="wallet" title="No payslips in {{ selectedYear() }}" subtitle="Try selecting a different year." />
        } @else {
          <div class="space-y-2">
            @for (p of filtered(); track p.id) {
              <button
                type="button"
                (click)="downloadPdf(p)"
                [disabled]="downloadingId() !== null"
                class="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left dark:border-neutral-800 dark:bg-neutral-900 active:scale-98 transition disabled:opacity-60"
              >
                <div class="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{{ monthShort(p.month) }}</span>
                  <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{{ p.year }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ monthFull(p.month) }}</div>
                  <div class="mt-0.5 text-xs text-neutral-500">Net {{ p.net_salary | number:'1.2-2' }} MYR</div>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <app-mobile-status-badge [label]="p.status" [tone]="statusTone(p.status)" />
                  @if (downloadingId() === p.id) {
                    <z-icon zType="loader-circle" zSize="sm" class="animate-spin text-emerald-600"></z-icon>
                  } @else {
                    <z-icon zType="download" zSize="sm" class="text-neutral-400"></z-icon>
                  }
                </div>
              </button>
            }
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobilePayslipComponent implements OnInit {
  private auth = inject(AuthService);
  private payroll = inject(PayrollService);
  private payslipPdf = inject(PayslipPdfService);
  private native = inject(NativeService);

  readonly loading = signal(false);
  readonly all = signal<Payroll[]>([]);
  readonly latest = signal<Payroll | null>(null);
  readonly selectedYear = signal<number>(new Date().getFullYear());
  readonly downloadingId = signal<number | null>(null);

  readonly years = computed(() => {
    const set = new Set<number>();
    for (const p of this.all()) set.add(p.year);
    return Array.from(set).sort((a, b) => b - a);
  });

  readonly filtered = computed(() =>
    this.all()
      .filter(p => p.year === this.selectedYear())
      .sort((a, b) => b.month - a.month),
  );

  ngOnInit(): void {
    const eid = this.auth.currentUserSignal()?.employee?.public_id;
    if (!eid) return;
    this.loading.set(true);
    this.payroll.getPayrolls({ employee_id: eid, page: 1, limit: 100 }).subscribe({
      next: (res: any) => {
        const items: Payroll[] = res?.data?.payrolls || [];
        this.all.set(items);
        this.latest.set(items[0] || null);
        const ys = this.years();
        if (ys.length && !ys.includes(this.selectedYear())) {
          this.selectedYear.set(ys[0]);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setYear(y: number): void {
    this.native.hapticLight();
    this.selectedYear.set(y);
  }

  async downloadPdf(p: Payroll): Promise<void> {
    if (this.downloadingId() !== null) return;
    this.native.hapticLight();
    const ref = p.public_id;
    if (!ref) {
      toast.error('Payslip reference missing');
      return;
    }
    this.downloadingId.set(p.id);
    const toastId = toast.loading('Generating payslip PDF...');
    try {
      const { blob, fileName } = await this.payslipPdf.generateForPayrollId(ref);
      await this.native.saveAndShareFile(blob, fileName, 'application/pdf');
      toast.success('Payslip ready', { id: toastId });
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('share canceled')) {
        toast.dismiss(toastId);
        return;
      }
      console.error('Payslip PDF error:', err);
      toast.error('Failed to generate payslip PDF', { id: toastId });
    } finally {
      this.downloadingId.set(null);
    }
  }

  monthLabel(m: number, y: number): string {
    return `${MONTHS[m - 1] ?? ''} ${y}`;
  }

  monthShort(m: number): string {
    return MONTHS[m - 1] ?? '';
  }

  monthFull(m: number): string {
    const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return names[m - 1] ?? '';
  }

  formatDate(s: string): string {
    return new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  statusTone(s: string): MobileStatusTone {
    if (s === 'Paid' || s === 'Approved') return 'emerald';
    if (s === 'Pending') return 'amber';
    if (s === 'Rejected') return 'rose';
    return 'neutral';
  }
}
