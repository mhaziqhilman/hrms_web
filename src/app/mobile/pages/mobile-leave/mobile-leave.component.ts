import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '@/core/services/auth.service';
import { LeaveService } from '@/features/leave/services/leave.service';
import {
  LEAVE_TYPE_COLORS,
  LeaveStatus,
  type Leave,
} from '@/features/leave/models/leave.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

interface BalanceCard {
  typeId: number;
  name: string;
  total: number;
  used: number;
  pending: number;
  balance: number;
  color: string;
}

type StatusFilter = 'all' | LeaveStatus;

@Component({
  selector: 'app-mobile-leave',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardIconComponent,
    MobilePageHeaderComponent,
    MobileEmptyStateComponent,
  ],
  template: `
    <section class="space-y-5 pb-24">
      <app-mobile-page-header title="Leave" subtitle="Balance and applications">
        <div slot="action" class="flex items-center gap-2">
          <a
            routerLink="/m/leave/calendar"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 active:scale-95 transition"
            aria-label="Leave calendar"
          >
            <z-icon zType="calendar" zSize="sm"></z-icon>
          </a>
          <a
            routerLink="/m/leave/apply"
            class="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/30 active:scale-95 transition"
          >
            <z-icon zType="plus" zSize="sm"></z-icon>
            Apply
          </a>
        </div>
      </app-mobile-page-header>

      <!-- Year totals summary card -->
      @if (!loadingBalance() && balance().length > 0) {
        <div class="rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 p-5 text-white shadow-xl shadow-violet-500/20">
          <p class="text-xs font-medium uppercase tracking-wider opacity-80">Total available · {{ currentYear }}</p>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-4xl font-bold tabular-nums">{{ totalBalance() }}</span>
            <span class="text-sm opacity-80">/ {{ totalEntitled() }} days</span>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-3 text-center">
            <div class="rounded-xl bg-white/10 px-2 py-2 backdrop-blur">
              <p class="text-[10px] uppercase tracking-wider opacity-70">Used</p>
              <p class="mt-0.5 text-base font-bold tabular-nums">{{ totalUsed() }}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-2 py-2 backdrop-blur">
              <p class="text-[10px] uppercase tracking-wider opacity-70">Pending</p>
              <p class="mt-0.5 text-base font-bold tabular-nums">{{ totalPending() }}</p>
            </div>
            <div class="rounded-xl bg-white/10 px-2 py-2 backdrop-blur">
              <p class="text-[10px] uppercase tracking-wider opacity-70">Left</p>
              <p class="mt-0.5 text-base font-bold tabular-nums">{{ totalBalance() }}</p>
            </div>
          </div>
        </div>
      }

      <!-- Balance per type -->
      <div>
        <h2 class="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Your balance</h2>

        @if (loadingBalance()) {
          <div
            class="grid grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-1 no-scrollbar snap-x"
            [style.grid-auto-columns]="'calc((100% - 0.75rem) / 2)'"
          >
            @for (_ of [1,2,3,4]; track $index) {
              <div class="h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800 snap-start"></div>
            }
          </div>
        } @else if (balance().length === 0) {
          <app-mobile-empty-state
            icon="calendar-x"
            title="No entitlements yet"
            subtitle="Your HR admin needs to set up leave entitlements for this year."
          />
        } @else {
          <div
            class="grid grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-1 no-scrollbar snap-x"
            [style.grid-auto-columns]="'calc((100% - 0.75rem) / 2)'"
          >
            @for (card of balance(); track card.typeId) {
              <div class="snap-start rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class="h-2 w-2 rounded-full shrink-0" [style.background-color]="card.color"></span>
                      <p class="truncate text-xs font-semibold text-neutral-700 dark:text-neutral-200">{{ card.name }}</p>
                    </div>
                  </div>
                </div>
                <div class="mt-2 flex items-baseline gap-1">
                  <span class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 tabular-nums">
                    {{ card.balance }}
                  </span>
                  <span class="text-xs text-neutral-500">/ {{ card.total }} days</span>
                </div>
                <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    class="h-full rounded-full transition-all"
                    [style.width.%]="usedPct(card)"
                    [style.background-color]="card.color"
                  ></div>
                </div>
                <div class="mt-2 flex justify-between text-[10px] font-medium text-neutral-500">
                  <span>Used {{ card.used }}</span>
                  @if (card.pending > 0) {
                    <span class="text-amber-600 dark:text-amber-400">Pending {{ card.pending }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Status filter tabs -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Your applications</h2>
          <span class="text-xs text-neutral-500 tabular-nums">{{ filteredLeaves().length }} of {{ leaves().length }}</span>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-3 no-scrollbar">
          @for (chip of statusChips; track chip.value) {
            <button
              type="button"
              (click)="setStatusFilter(chip.value)"
              class="inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
              [class]="statusFilter() === chip.value
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'"
            >
              <span>{{ chip.label }}</span>
              <span class="rounded-full px-1.5 text-[10px] tabular-nums"
                [class]="statusFilter() === chip.value ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'">
                {{ statusCounts()[chip.value] || 0 }}
              </span>
            </button>
          }
        </div>

        <!-- Leave list -->
        @if (loadingLeaves()) {
          <div class="space-y-2">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-24 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
            }
          </div>
        } @else if (filteredLeaves().length === 0) {
          <app-mobile-empty-state
            icon="calendar"
            [title]="leaves().length === 0 ? 'No leave applications' : 'No ' + statusFilter() + ' leaves'"
            [subtitle]="leaves().length === 0 ? 'Tap Apply to submit your first leave request.' : 'Try a different status filter.'"
          />
        } @else {
          <div class="space-y-2.5">
            @for (leave of filteredLeaves(); track leave.id) {
              <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div class="flex">
                  <!-- Color stripe -->
                  <div class="w-1.5 shrink-0" [style.background-color]="leaveColor(leave)"></div>
                  <div class="flex-1 p-4 min-w-0">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <p class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                            {{ leave.leave_type?.name || 'Leave' }}
                          </p>
                          @if (leave.is_half_day) {
                            <span class="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                              Half-day {{ leave.half_day_period }}
                            </span>
                          }
                        </div>
                        <div class="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                          <z-icon zType="calendar" zSize="sm" class="h-3 w-3 opacity-60"></z-icon>
                          <span class="text-neutral-700 dark:text-neutral-300">{{ formatDate(leave.start_date) }}</span>
                          @if (leave.start_date !== leave.end_date) {
                            <span class="text-neutral-300">→</span>
                            <span class="text-neutral-700 dark:text-neutral-300">{{ formatDate(leave.end_date) }}</span>
                          }
                          <span class="text-neutral-300">·</span>
                          <span class="font-medium tabular-nums">{{ leave.total_days }} {{ leave.total_days === 1 ? 'day' : 'days' }}</span>
                        </div>
                      </div>
                      <span
                        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
                        [class]="statusChip(leave.status)"
                      >
                        <z-icon [zType]="statusIcon(leave.status)" zSize="sm" class="h-3 w-3"></z-icon>
                        {{ leave.status }}
                      </span>
                    </div>

                    @if (leave.reason) {
                      <p class="mt-2 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{{ leave.reason }}</p>
                    }

                    @if (leave.status === 'Approved' && leave.approver) {
                      <div class="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                        <z-icon zType="circle-check" zSize="sm" class="h-3 w-3"></z-icon>
                        <span>Approved by {{ leave.approver.email }}</span>
                      </div>
                    }
                    @if (leave.status === 'Rejected' && leave.rejection_reason) {
                      <div class="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                        <span class="font-semibold">Reason: </span>{{ leave.rejection_reason }}
                      </div>
                    }
                    @if (leave.attachment_url) {
                      <a
                        [href]="leave.attachment_url"
                        target="_blank"
                        rel="noopener"
                        class="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400"
                      >
                        <z-icon zType="file-text" zSize="sm" class="h-3 w-3"></z-icon>
                        View attachment
                      </a>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileLeaveComponent implements OnInit {
  private auth = inject(AuthService);
  private leaveService = inject(LeaveService);

  readonly loadingBalance = signal(false);
  readonly loadingLeaves = signal(false);
  readonly balance = signal<BalanceCard[]>([]);
  readonly leaves = signal<Leave[]>([]);
  readonly statusFilter = signal<StatusFilter>('all');

  readonly currentYear = new Date().getFullYear();

  readonly statusChips: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: LeaveStatus.PENDING },
    { label: 'Approved', value: LeaveStatus.APPROVED },
    { label: 'Rejected', value: LeaveStatus.REJECTED },
    { label: 'Cancelled', value: LeaveStatus.CANCELLED },
  ];

  // Aggregates for the hero summary
  readonly totalEntitled = computed(() =>
    this.balance().reduce((sum, c) => sum + c.total, 0),
  );
  readonly totalUsed = computed(() =>
    +this.balance().reduce((sum, c) => sum + c.used, 0).toFixed(1),
  );
  readonly totalPending = computed(() =>
    +this.balance().reduce((sum, c) => sum + c.pending, 0).toFixed(1),
  );
  readonly totalBalance = computed(() =>
    +this.balance().reduce((sum, c) => sum + c.balance, 0).toFixed(1),
  );

  readonly statusCounts = computed(() => {
    const counts: Record<string, number> = { all: this.leaves().length };
    for (const l of this.leaves()) {
      counts[l.status] = (counts[l.status] || 0) + 1;
    }
    return counts;
  });

  readonly filteredLeaves = computed(() => {
    const f = this.statusFilter();
    if (f === 'all') return this.leaves();
    return this.leaves().filter((l) => l.status === f);
  });

  // UUID guard — same approach as mobile-attendance.
  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private get employeePublicId(): string | null {
    const emp: any = this.auth.currentUserSignal()?.employee;
    const pid = emp?.public_id;
    if (typeof pid !== 'string') return null;
    return MobileLeaveComponent.UUID_RE.test(pid) ? pid : null;
  }

  ngOnInit(): void {
    if (!this.employeePublicId) {
      this.auth.getCurrentUser().subscribe({
        next: () => this.loadAll(),
        error: () => this.loadAll(),
      });
    } else {
      this.loadAll();
    }
  }

  private loadAll(): void {
    this.loadBalance();
    this.loadLeaves();
  }

  private loadBalance(): void {
    const id = this.employeePublicId;
    if (!id) return;
    this.loadingBalance.set(true);
    this.leaveService.getLeaveBalance(id).subscribe({
      next: (res) => {
        const entitlements = res.data?.entitlements || [];
        this.balance.set(
          entitlements.map((e) => ({
            typeId: e.leave_type.id,
            name: e.leave_type.name,
            total: e.total_days,
            used: e.used_days,
            pending: e.pending_days,
            balance: e.balance_days,
            color: LEAVE_TYPE_COLORS[e.leave_type.name] || '#8b5cf6',
          })),
        );
        this.loadingBalance.set(false);
      },
      error: () => {
        this.balance.set([]);
        this.loadingBalance.set(false);
      },
    });
  }

  private loadLeaves(): void {
    this.loadingLeaves.set(true);
    // Match web behaviour: no employee_id query param. Backend auto-filters
    // by JWT for `staff` role; for admin/manager it returns the whole company,
    // so we filter client-side to keep this page's "Your applications" scope.
    this.leaveService.getLeaves({ page: 1, limit: 50 }).subscribe({
      next: (res) => {
        const all = res.data?.leaves || [];
        const myIntId = this.auth.currentUserSignal()?.employee?.id;
        const mine = myIntId
          ? all.filter((l) => l.employee_id === myIntId || l.employee?.id === myIntId)
          : all;
        this.leaves.set(mine);
        this.loadingLeaves.set(false);
      },
      error: () => {
        this.leaves.set([]);
        this.loadingLeaves.set(false);
      },
    });
  }

  setStatusFilter(s: StatusFilter): void {
    this.statusFilter.set(s);
  }

  usedPct(c: BalanceCard): number {
    if (c.total <= 0) return 0;
    return Math.min(100, (c.used / c.total) * 100);
  }

  leaveColor(leave: Leave): string {
    return LEAVE_TYPE_COLORS[leave.leave_type?.name || ''] || '#8b5cf6';
  }

  statusChip(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
      case 'Cancelled':
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
      default:
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }
  }

  statusIcon(status: string): any {
    switch (status) {
      case 'Approved':
        return 'circle-check';
      case 'Pending':
        return 'clock';
      case 'Rejected':
        return 'circle-x';
      case 'Cancelled':
        return 'circle-x';
      default:
        return 'clock';
    }
  }

  formatDate(s: string): string {
    return new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
