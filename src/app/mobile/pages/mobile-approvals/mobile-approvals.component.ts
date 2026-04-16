import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { LeaveService } from '@/features/leave/services/leave.service';
import { ClaimService } from '@/features/claims/services/claim.service';
import { AttendanceService } from '@/features/attendance/services/attendance.service';
import type { Leave } from '@/features/leave/models/leave.model';
import type { Claim } from '@/features/claims/models/claim.model';
import type { WFHApplication } from '@/features/attendance/models/attendance.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { NativeService } from '@/mobile/services/native.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

type TabKey = 'leave' | 'claim' | 'wfh';
type SubTab = 'summary' | 'request';

interface StatCard {
  label: string;
  value: string;
  trend: number[];
  accent: 'emerald' | 'amber' | 'rose' | 'indigo';
  chart: 'line' | 'bar';
}

interface StatusCard {
  label: string;
  value: string;
  icon: string;
  accent: 'indigo' | 'emerald' | 'rose';
}

interface TypeBreakdown {
  name: string;
  count: number;
}

type PendingItem =
  | { kind: 'leave'; item: Leave }
  | { kind: 'claim'; item: Claim }
  | { kind: 'wfh'; item: WFHApplication };

type PendingAction = PendingItem & { mode: 'approve' | 'reject' };

@Component({
  selector: 'app-mobile-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardIconComponent, MobilePageHeaderComponent, MobileEmptyStateComponent],
  template: `
    <section class="space-y-4">
      <app-mobile-page-header title="Approvals" subtitle="Pending requests from your team" />

      <!-- Primary tabs -->
      <div class="flex gap-1 rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-900">
        @for (tab of tabs; track tab.key) {
          <button
            type="button"
            (click)="setTab(tab.key)"
            class="relative flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition"
            [class]="active() === tab.key
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50'
              : 'text-neutral-600 dark:text-neutral-400'"
          >
            {{ tab.label }}
            @if (pendingCounts()[tab.key] > 0) {
              <span class="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {{ pendingCounts()[tab.key] }}
              </span>
            }
          </button>
        }
      </div>

      <!-- Sub-tabs: Summary / Request (shown for Claims only — Leave/WFH use single merged view) -->
      @if (active() === 'claim') {
        <div class="flex border-b border-neutral-200 dark:border-neutral-800">
          @for (sub of subTabs; track sub.key) {
            <button
              type="button"
              (click)="setSub(sub.key)"
              class="relative flex-1 px-3 pb-3 pt-1 text-sm font-semibold transition"
              [class]="activeSub() === sub.key
                ? 'text-neutral-900 dark:text-neutral-50'
                : 'text-neutral-500 dark:text-neutral-400'"
            >
              {{ subLabel(sub.key) }}
              @if (activeSub() === sub.key) {
                <span class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
              }
            </button>
          }
        </div>
      }

      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
          }
        </div>
      } @else {
        <!-- ============ SUMMARY ============ -->
        @if (active() !== 'claim' || activeSub() === 'summary') {
          <div class="space-y-3">
            <!-- Headline (like "Time Off Request" / "Overtime Request") -->
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {{ summaryHeading() }}
              </h2>
              @if (active() === 'claim') {
                <span class="text-[11px] text-neutral-500">Last 7 days</span>
              }
            </div>

            <!-- ====== LEAVE & WFH: "Time Off" layout (3 equal stat cards + progress-bar breakdown) ====== -->
            @if (active() === 'leave' || active() === 'wfh') {
              <div class="grid grid-cols-3 gap-2">
                @for (card of statusCards(); track card.label) {
                  <div class="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full" [class]="iconBg(card.accent)">
                      <z-icon [zType]="$any(card.icon)" zSize="sm" [class]="iconColor(card.accent)"></z-icon>
                    </div>
                    <div class="text-[11px] text-neutral-500">{{ card.label }}</div>
                    <div class="mt-0.5 text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                      {{ card.value }}
                    </div>
                  </div>
                }
              </div>

              @if (active() === 'leave' && typeBreakdown().length > 0) {
                <div class="mt-4 space-y-3">
                  <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Leave Request Type</h3>
                  <div class="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    @for (t of typeBreakdown(); track t.name) {
                      <div>
                        <div class="mb-1.5 text-sm text-neutral-700 dark:text-neutral-300">{{ t.name }}</div>
                        <div class="flex items-center gap-2">
                          <div class="relative h-1.5 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <div
                              class="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
                              [style.width.%]="breakdownPct(t.count, typeBreakdown())"
                            ></div>
                          </div>
                          <span class="w-6 text-right text-xs font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">{{ t.count }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            }

            <!-- ====== CLAIM: "Overtime" layout (hero + 2 side-by-side with sparklines) ====== -->
            @if (active() === 'claim') {
              @if (statCards().length > 0) {
                <div class="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-xs text-neutral-500">{{ statCards()[0].label }}</div>
                      <div class="mt-1 text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                        {{ statCards()[0].value }}
                      </div>
                      <div class="mt-0.5 text-[10px] text-neutral-400">Total {{ statCards()[0].label }}</div>
                    </div>
                    <div [innerHTML]="sparkSvg(statCards()[0])" class="flex-shrink-0"></div>
                  </div>
                  <div class="mt-1 flex justify-between px-1 text-[9px] font-medium text-neutral-400">
                    @for (d of dayLabels; track $index) { <span>{{ d }}</span> }
                  </div>
                </div>

                @if (statCards().length > 1) {
                  <div class="grid grid-cols-2 gap-3">
                    @for (card of statCards().slice(1); track card.label) {
                      <div class="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                        <div class="text-[11px] text-neutral-500">{{ card.label }}</div>
                        <div class="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                          {{ card.value }}
                        </div>
                        <div class="text-[10px] text-neutral-400">Total {{ card.label }}</div>
                        <div class="mt-2" [innerHTML]="sparkSvg(card, 110, 36)"></div>
                      </div>
                    }
                  </div>
                }
              }

              @if (claimTypeBreakdown().length > 0) {
                <div class="mt-4 space-y-2">
                  <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Claim Request Type</h3>
                  <div class="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                    @for (t of claimTypeBreakdown(); track t.name) {
                      <div class="flex items-center justify-between px-4 py-3">
                        <span class="text-sm text-neutral-700 dark:text-neutral-300">{{ t.name }}</span>
                        <span class="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                          {{ t.count }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        }

        <!-- ============ REQUEST ============ -->
        @if (active() !== 'claim' || activeSub() === 'request') {
          <!-- Leave -->
          @if (active() === 'leave') {
            <h3 class="mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-50">Leave Request</h3>
            @if (leaves().length === 0) {
              <app-mobile-empty-state icon="calendar" title="No pending leaves" subtitle="All caught up." />
            } @else {
              <div class="space-y-2">
                @for (l of leaves(); track l.id) {
                  <div class="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                          {{ l.employee?.full_name }}
                        </div>
                        <div class="mt-0.5 text-xs text-neutral-500">
                          {{ l.leave_type?.name }} · {{ formatDate(l.start_date) }}
                          @if (l.start_date !== l.end_date) { → {{ formatDate(l.end_date) }} }
                          · {{ l.total_days }}d
                        </div>
                        @if (l.reason) {
                          <p class="mt-2 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{{ l.reason }}</p>
                        }
                      </div>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" (click)="askReject({ kind: 'leave', item: l })" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 active:scale-95 transition">
                        <span class="inline-flex items-center justify-center gap-1.5"><z-icon zType="x" zSize="sm"></z-icon>Reject</span>
                      </button>
                      <button type="button" (click)="askApprove({ kind: 'leave', item: l })" class="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition">
                        <span class="inline-flex items-center justify-center gap-1.5"><z-icon zType="check" zSize="sm"></z-icon>Approve</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- Claim -->
          @if (active() === 'claim') {
            @if (claims().length === 0) {
              <app-mobile-empty-state icon="receipt-text" title="No pending claims" subtitle="All caught up." />
            } @else {
              <div class="space-y-2">
                @for (c of claims(); track c.id) {
                  <div class="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                          {{ c.employee?.full_name }}
                        </div>
                        <div class="mt-0.5 text-xs text-neutral-500">{{ c.claimType?.name }} · {{ formatDate(c.date) }}</div>
                        @if (c.description) {
                          <p class="mt-2 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{{ c.description }}</p>
                        }
                      </div>
                      <div class="text-right flex-shrink-0">
                        <div class="text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                          {{ Number(c.amount) | number:'1.2-2' }}
                        </div>
                        <div class="text-[10px] text-neutral-500">MYR</div>
                      </div>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" (click)="askReject({ kind: 'claim', item: c })" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 active:scale-95 transition">
                        <span class="inline-flex items-center justify-center gap-1.5"><z-icon zType="x" zSize="sm"></z-icon>Reject</span>
                      </button>
                      <button type="button" (click)="askApprove({ kind: 'claim', item: c })" class="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition">
                        <span class="inline-flex items-center justify-center gap-1.5"><z-icon zType="check" zSize="sm"></z-icon>Approve</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- WFH -->
          @if (active() === 'wfh') {
            <h3 class="mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-50">WFH Request</h3>
            @if (wfhList().length === 0) {
              <app-mobile-empty-state icon="house" title="No pending WFH" subtitle="All caught up." />
            } @else {
              <div class="space-y-2">
                @for (w of wfhList(); track w.id) {
                  <div class="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                          {{ w.employee?.full_name }}
                        </div>
                        <div class="mt-0.5 text-xs text-neutral-500">{{ formatDate(w.date) }}</div>
                        @if (w.reason) {
                          <p class="mt-2 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{{ w.reason }}</p>
                        }
                      </div>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" (click)="askReject({ kind: 'wfh', item: w })" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 active:scale-95 transition">
                        <span class="inline-flex items-center justify-center gap-1.5"><z-icon zType="x" zSize="sm"></z-icon>Reject</span>
                      </button>
                      <button type="button" (click)="askApprove({ kind: 'wfh', item: w })" class="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition">
                        <span class="inline-flex items-center justify-center gap-1.5"><z-icon zType="check" zSize="sm"></z-icon>Approve</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          }
        }
      }
    </section>

    <!-- ========== Approve confirmation dialog (centered alert) ========== -->
    @if (pending(); as p) {
      @if (p.mode === 'approve') {
        <div class="fixed inset-0 z-50 flex items-center justify-center px-6" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade-in" (click)="closeDialog()"></div>
          <div class="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900 anim-scale-in">
            <div class="flex flex-col items-center text-center">
              <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                <z-icon zType="check" zSize="lg"></z-icon>
              </div>
              <h2 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                Approve {{ pendingTypeLabel() }} request?
              </h2>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Confirm approval for {{ pendingName() }}.
              </p>
            </div>
            <div class="mt-6 grid grid-cols-2 gap-3">
              <button type="button" (click)="closeDialog()" [disabled]="submitting()"
                class="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-95 transition disabled:opacity-50">
                Cancel
              </button>
              <button type="button" (click)="confirmAction()" [disabled]="submitting()"
                class="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-95 transition disabled:opacity-50">
                {{ submitting() ? 'Approving…' : 'Approve' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========== Reject bottom sheet ========== -->
      @if (p.mode === 'reject') {
        <div class="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm anim-fade-in" (click)="closeDialog()"></div>
          <div class="relative w-full rounded-t-3xl bg-white p-6 pb-8 shadow-xl dark:bg-neutral-900 anim-sheet-in">
            <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                  Are you sure for Rejected {{ pendingName() }}
                </h2>
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {{ pendingTypeLabel() | titlecase }} request ?
                </p>
              </div>
              <button type="button" (click)="closeDialog()" class="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                <z-icon zType="x" zSize="sm"></z-icon>
              </button>
            </div>
            <textarea
              [ngModel]="rejectReason()"
              (ngModelChange)="rejectReason.set($event)"
              rows="4"
              placeholder="Reason for rejection…"
              class="mt-4 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
            ></textarea>
            <div class="mt-6 flex items-center justify-end gap-3">
              <button type="button" (click)="closeDialog()" [disabled]="submitting()"
                class="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 active:scale-95 transition disabled:opacity-50">
                Cancel
              </button>
              <button type="button" (click)="confirmAction()" [disabled]="submitting()"
                class="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm dark:bg-neutral-50 dark:text-neutral-900 active:scale-95 transition disabled:opacity-50">
                {{ submitting() ? 'Rejecting…' : 'Rejected' }}
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileApprovalsComponent implements OnInit {
  private leaveService = inject(LeaveService);
  private claimService = inject(ClaimService);
  private attendance = inject(AttendanceService);
  private native = inject(NativeService);
  private sanitizer = inject(DomSanitizer);

  readonly tabs: { key: TabKey; label: string }[] = [
    { key: 'leave', label: 'Leave' },
    { key: 'claim', label: 'Claims' },
    { key: 'wfh', label: 'WFH' },
  ];

  readonly subTabs: { key: SubTab }[] = [
    { key: 'summary' },
    { key: 'request' },
  ];

  readonly dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  readonly active = signal<TabKey>('leave');
  readonly activeSub = signal<SubTab>('summary');
  readonly loading = signal(false);

  // Pending (drives Request lists + tab badges)
  readonly leaves = signal<Leave[]>([]);
  readonly claims = signal<Claim[]>([]);
  readonly wfhList = signal<WFHApplication[]>([]);

  // All-status pools for summary aggregation
  readonly leavesAll = signal<Leave[]>([]);
  readonly claimsAll = signal<Claim[]>([]);
  readonly wfhAll = signal<WFHApplication[]>([]);

  readonly pendingCounts = computed(() => ({
    leave: this.leaves().length,
    claim: this.claims().length,
    wfh: this.wfhList().length,
  }));

  readonly summaryHeading = computed(() => {
    switch (this.active()) {
      case 'leave': return 'Leave Request';
      case 'claim': return 'Claim Request';
      case 'wfh': return 'WFH Request';
    }
  });

  readonly statCards = computed<StatCard[]>(() => {
    const tab = this.active();
    if (tab === 'leave') return this.buildLeaveCards();
    if (tab === 'claim') return this.buildClaimCards();
    return this.buildWfhCards();
  });

  /** 3-count summary for Leave/WFH — matches "Time Off Request" cards in the design. */
  readonly statusCards = computed<StatusCard[]>(() => {
    const tab = this.active();
    const pool = tab === 'leave' ? this.leavesAll() : this.wfhAll();
    const requested = pool.filter((x) => x.status === 'Pending').length;
    const approved = pool.filter((x) => x.status === 'Approved').length;
    const rejected = pool.filter((x) => x.status === 'Rejected').length;
    const icon = tab === 'leave' ? 'calendar' : 'house';
    return [
      { label: 'Requested', value: String(requested), icon, accent: 'indigo' },
      { label: 'Approved', value: String(approved), icon, accent: 'emerald' },
      { label: 'Rejected', value: String(rejected), icon, accent: 'rose' },
    ];
  });

  breakdownPct(count: number, all: TypeBreakdown[]): number {
    const max = Math.max(1, ...all.map((t) => t.count));
    return Math.round((count / max) * 100);
  }

  iconBg(accent: StatusCard['accent']): string {
    return {
      indigo: 'bg-indigo-100 dark:bg-indigo-500/20',
      emerald: 'bg-emerald-100 dark:bg-emerald-500/20',
      rose: 'bg-rose-100 dark:bg-rose-500/20',
    }[accent];
  }

  iconColor(accent: StatusCard['accent']): string {
    return {
      indigo: 'text-indigo-600 dark:text-indigo-300',
      emerald: 'text-emerald-600 dark:text-emerald-300',
      rose: 'text-rose-600 dark:text-rose-300',
    }[accent];
  }

  readonly typeBreakdown = computed<TypeBreakdown[]>(() => {
    const map = new Map<string, number>();
    for (const l of this.leavesAll()) {
      const name = l.leave_type?.name || 'Other';
      map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  });

  readonly claimTypeBreakdown = computed<TypeBreakdown[]>(() => {
    const map = new Map<string, number>();
    for (const c of this.claimsAll()) {
      const name = c.claimType?.name || 'Other';
      map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  });

  protected readonly Number = Number;

  ngOnInit(): void {
    this.loadAll();
  }

  setTab(key: TabKey): void {
    this.native.hapticLight();
    this.active.set(key);
  }

  setSub(key: SubTab): void {
    this.native.hapticLight();
    this.activeSub.set(key);
  }

  subLabel(key: SubTab): string {
    const base = this.active() === 'leave' ? 'Leave' : this.active() === 'claim' ? 'Claim' : 'WFH';
    return key === 'summary' ? `${base} Summary` : `${base} Request`;
  }

  private loadAll(): void {
    this.loading.set(true);
    let pending = 6;
    const done = () => {
      pending -= 1;
      if (pending === 0) this.loading.set(false);
    };

    // Pending pools
    this.leaveService.getLeaves({ status: 'Pending' as any, page: 1, limit: 50 }).subscribe({
      next: (res) => { this.leaves.set(res.data?.leaves || []); done(); }, error: done,
    });
    this.claimService.getAllClaims({ status: 'Pending', page: 1, limit: 50 }).subscribe({
      next: (res) => { this.claims.set(res.data || []); done(); }, error: done,
    });
    this.attendance.getAllWFH({ status: 'Pending' as any, page: 1, limit: 50 }).subscribe({
      next: (res) => { this.wfhList.set(res.data || []); done(); }, error: done,
    });

    // All-status pools (last 90 days worth, 200 rows max — enough for 7-day trend + breakdowns)
    this.leaveService.getLeaves({ page: 1, limit: 200 }).subscribe({
      next: (res) => { this.leavesAll.set(res.data?.leaves || []); done(); }, error: done,
    });
    this.claimService.getAllClaims({ page: 1, limit: 200 }).subscribe({
      next: (res) => { this.claimsAll.set(res.data || []); done(); }, error: done,
    });
    this.attendance.getAllWFH({ page: 1, limit: 200 }).subscribe({
      next: (res) => { this.wfhAll.set(res.data || []); done(); }, error: done,
    });
  }

  // ========== Summary builders ==========

  private buildLeaveCards(): StatCard[] {
    const all = this.leavesAll();
    const pending = all.filter((l) => l.status === 'Pending');
    const approved = all.filter((l) => l.status === 'Approved');
    const totalDays = pending.reduce((s, l) => s + (Number(l.total_days) || 0), 0);

    return [
      { label: 'Leave Days', value: String(totalDays), trend: this.weekTrend(all, (l) => l.created_at || l.start_date), accent: 'emerald', chart: 'line' },
      { label: 'Requested', value: String(pending.length), trend: this.weekTrend(pending, (l) => l.created_at || l.start_date), accent: 'amber', chart: 'bar' },
      { label: 'Approved', value: String(approved.length), trend: this.weekTrend(approved, (l) => l.created_at || l.start_date), accent: 'indigo', chart: 'line' },
    ];
  }

  private buildClaimCards(): StatCard[] {
    const all = this.claimsAll();
    const pending = all.filter((c) => c.status === 'Pending');
    const approved = all.filter((c) => c.status === 'Manager_Approved' || c.status === 'Finance_Approved' || c.status === 'Paid');
    const totalAmount = pending.reduce((s, c) => s + (Number(c.amount) || 0), 0);

    return [
      { label: 'Claim Amount (MYR)', value: totalAmount.toFixed(0), trend: this.weekTrend(all, (c) => c.created_at || c.date), accent: 'emerald', chart: 'line' },
      { label: 'Requested', value: String(pending.length), trend: this.weekTrend(pending, (c) => c.created_at || c.date), accent: 'amber', chart: 'bar' },
      { label: 'Approved', value: String(approved.length), trend: this.weekTrend(approved, (c) => c.created_at || c.date), accent: 'indigo', chart: 'line' },
    ];
  }

  private buildWfhCards(): StatCard[] {
    const all = this.wfhAll();
    const pending = all.filter((w) => w.status === 'Pending');
    const approved = all.filter((w) => w.status === 'Approved');

    return [
      { label: 'WFH Days', value: String(pending.length), trend: this.weekTrend(all, (w) => w.created_at || w.date), accent: 'emerald', chart: 'line' },
      { label: 'Requested', value: String(pending.length), trend: this.weekTrend(pending, (w) => w.created_at || w.date), accent: 'amber', chart: 'bar' },
      { label: 'Approved', value: String(approved.length), trend: this.weekTrend(approved, (w) => w.created_at || w.date), accent: 'indigo', chart: 'line' },
    ];
  }

  /** Aggregate a list into counts for the last 7 days (oldest → newest). */
  private weekTrend<T>(items: T[], dateOf: (x: T) => string | undefined): number[] {
    const buckets = new Array(7).fill(0) as number[];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 6);

    for (const it of items) {
      const raw = dateOf(it);
      if (!raw) continue;
      const d = new Date(raw);
      if (isNaN(d.getTime())) continue;
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((d.getTime() - start.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) buckets[diff] += 1;
    }
    return buckets;
  }

  // ========== SVG sparkline ==========

  sparkSvg(card: StatCard, width = 120, height = 48): SafeHtml {
    const pad = 4;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const max = Math.max(1, ...card.trend);
    const step = card.trend.length > 1 ? w / (card.trend.length - 1) : w;

    const stroke = this.accentStroke(card.accent);
    const fill = this.accentFill(card.accent);

    if (card.chart === 'bar') {
      const bw = Math.max(4, step * 0.55);
      const bars = card.trend
        .map((v, i) => {
          const bh = (v / max) * h;
          const x = pad + i * step - bw / 2;
          const y = pad + (h - bh);
          return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${bh.toFixed(2)}" rx="2" fill="${stroke}"/>`;
        })
        .join('');
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`
      );
    }

    // line + area
    const pts = card.trend.map((v, i) => {
      const x = pad + i * step;
      const y = pad + (h - (v / max) * h);
      return [x, y] as const;
    });
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1][0].toFixed(2)},${pad + h} L${pts[0][0].toFixed(2)},${pad + h} Z`;
    const dots = pts.map((p) => `<circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="2" fill="${stroke}"/>`).join('');

    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <path d="${area}" fill="${fill}"/>
        <path d="${line}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
      </svg>`
    );
  }

  private accentStroke(a: StatCard['accent']): string {
    return { emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', indigo: '#6366f1' }[a];
  }
  private accentFill(a: StatCard['accent']): string {
    return { emerald: 'rgba(16,185,129,0.15)', amber: 'rgba(245,158,11,0.15)', rose: 'rgba(244,63,94,0.15)', indigo: 'rgba(99,102,241,0.15)' }[a];
  }

  // ========== Confirmation state + Actions ==========

  readonly pending = signal<PendingAction | null>(null);
  readonly rejectReason = signal('');
  readonly submitting = signal(false);

  askApprove(p: PendingItem): void {
    this.native.hapticLight();
    this.pending.set({ ...p, mode: 'approve' });
  }

  askReject(p: PendingItem): void {
    this.native.hapticLight();
    this.rejectReason.set('');
    this.pending.set({ ...p, mode: 'reject' });
  }

  closeDialog(): void {
    if (this.submitting()) return;
    this.pending.set(null);
    this.rejectReason.set('');
  }

  pendingName(): string {
    const p = this.pending();
    if (!p) return '';
    return p.item.employee?.full_name || '';
  }

  pendingTypeLabel(): string {
    const p = this.pending();
    if (!p) return '';
    return p.kind === 'leave' ? 'leave' : p.kind === 'claim' ? 'claim' : 'WFH';
  }

  confirmAction(): void {
    const p = this.pending();
    if (!p) return;
    this.native.hapticMedium();
    this.submitting.set(true);

    const onOk = () => {
      if (p.kind === 'leave') this.leaves.update((list) => list.filter((x) => x.id !== p.item.id));
      else if (p.kind === 'claim') this.claims.update((list) => list.filter((x) => x.id !== p.item.id));
      else this.wfhList.update((list) => list.filter((x) => x.id !== p.item.id));
      this.submitting.set(false);
      this.pending.set(null);
      this.rejectReason.set('');
    };
    const onErr = () => { this.submitting.set(false); };

    const reason = p.mode === 'reject' ? (this.rejectReason().trim() || undefined) : undefined;

    // Backend route params resolve to Leave.public_id / Claim.public_id / WFHApplication.public_id
    // (UUIDs). Sending the integer PK triggers Postgres "invalid input syntax for type uuid".
    const itemId: string | number = (p.item as any).public_id ?? p.item.id;

    if (p.kind === 'leave') {
      this.leaveService.approveRejectLeave(itemId as any, { action: p.mode, rejection_reason: reason })
        .subscribe({ next: onOk, error: onErr });
    } else if (p.kind === 'claim') {
      this.claimService.managerApproval(itemId as any, { action: p.mode, rejection_reason: reason })
        .subscribe({ next: onOk, error: onErr });
    } else {
      this.attendance.approveRejectWFH(itemId as any, p.mode, reason)
        .subscribe({ next: onOk, error: onErr });
    }
  }

  formatDate(s: string): string {
    return new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short' });
  }
}
