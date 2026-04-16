import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '@/core/services/auth.service';
import { AttendanceService } from '@/features/attendance/services/attendance.service';
import type { WFHApplication } from '@/features/attendance/models/attendance.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { NativeService } from '@/mobile/services/native.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Rejected';

@Component({
  selector: 'app-mobile-wfh',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardIconComponent,
    ZardDatePickerComponent,
    MobilePageHeaderComponent,
    MobileEmptyStateComponent,
  ],
  template: `
    <section class="space-y-5 pb-24">
      <app-mobile-page-header title="Work from home" subtitle="Submit and track WFH requests">
        @if (!isFlexible()) {
          <button
            slot="action"
            type="button"
            (click)="openSheet()"
            class="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/30 active:scale-95 transition"
          >
            <z-icon zType="plus" zSize="sm"></z-icon>
            New request
          </button>
        }
      </app-mobile-page-header>

      <!-- Flexible WFH banner -->
      @if (isFlexible()) {
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-5 text-white shadow-xl shadow-emerald-500/20">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <z-icon zType="circle-check" zSize="default"></z-icon>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                  Flexible WFH
                </span>
              </div>
              <p class="mt-1.5 text-base font-semibold leading-snug">
                You don't need to apply.
              </p>
              <p class="mt-1 text-xs opacity-80">
                Your admin granted you flexible work-from-home. Just pick <span class="font-semibold">WFH</span>
                as the attendance type when you clock in from home.
              </p>
            </div>
          </div>
        </div>
      }

      <!-- My WFH list -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Your requests</h2>
          @if (items().length > 0) {
            <span class="text-xs tabular-nums text-neutral-500">{{ filteredItems().length }} of {{ items().length }}</span>
          }
        </div>

        @if (items().length > 0) {
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
        }

        @if (loading()) {
          <div class="space-y-2">
            @for (_ of [1,2]; track $index) {
              <div class="h-20 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
            }
          </div>
        } @else if (items().length === 0) {
          <app-mobile-empty-state
            icon="home"
            [title]="isFlexible() ? 'No manual requests needed' : 'No WFH requests yet'"
            [subtitle]="isFlexible() ? 'Flexible WFH means you can just clock in from home.' : 'Tap New request to submit your first one.'"
          />
        } @else if (filteredItems().length === 0) {
          <app-mobile-empty-state
            icon="home"
            [title]="'No ' + statusFilter() + ' requests'"
            subtitle="Try a different filter."
          />
        } @else {
          <div class="space-y-2.5">
            @for (item of filteredItems(); track item.id) {
              <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div class="flex">
                  <div class="w-1.5 shrink-0 bg-violet-500"></div>
                  <div class="flex-1 p-4 min-w-0">
                    <div class="flex items-start gap-3">
                      <div class="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 shrink-0">
                        <span class="text-[10px] font-medium uppercase">{{ formatMonth(item.date) }}</span>
                        <span class="text-sm font-bold">{{ formatDay(item.date) }}</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-2">
                          <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ formatDate(item.date) }}</p>
                          <span
                            class="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
                            [class]="statusChip(item.status)"
                          >
                            {{ item.status }}
                          </span>
                        </div>
                        <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{{ item.reason }}</p>
                        @if (item.status === 'Rejected' && item.rejection_reason) {
                          <div class="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                            <span class="font-semibold">Reason: </span>{{ item.rejection_reason }}
                          </div>
                        }
                        <p class="mt-1.5 text-[11px] text-neutral-500">Submitted {{ formatDate(item.created_at) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <!-- ================ Bottom Sheet ================ -->
    @if (sheetOpen()) {
      <div
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm anim-fade-in"
        (click)="closeSheet()"
      ></div>
      <div
        class="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white shadow-2xl dark:bg-neutral-900 anim-sheet-in max-h-[90vh] overflow-y-auto"
      >
        <div class="flex justify-center pt-3 pb-1">
          <span class="h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
        </div>

        <div class="flex items-center justify-between px-5 pt-2 pb-3">
          <div>
            <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">New WFH request</h3>
            <p class="text-[11px] text-neutral-500">Submit for approval by your manager</p>
          </div>
          <button
            type="button"
            (click)="closeSheet()"
            class="h-8 w-8 inline-flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <z-icon zType="x" zSize="sm"></z-icon>
          </button>
        </div>

        @if (error()) {
          <div class="mx-5 mt-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="px-5 py-4 space-y-4">
          <div>
            <label class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Date</label>
            <z-date-picker
              formControlName="date"
              placeholder="Pick a date"
              zFormat="d MMM yyyy"
              [minDate]="today"
              class="block w-full"
            />
          </div>

          <div>
            <label class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Reason</label>
            <textarea
              formControlName="reason"
              rows="4"
              placeholder="Why are you requesting WFH?"
              class="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            ></textarea>
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 active:scale-[0.98] transition disabled:opacity-60"
          >
            @if (submitting()) {
              <z-icon zType="loader-circle" zSize="sm" class="animate-spin"></z-icon>
              <span>Submitting…</span>
            } @else {
              <z-icon zType="plus" zSize="sm"></z-icon>
              <span>Submit request</span>
            }
          </button>
        </form>
      </div>
    }
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileWfhComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private attendance = inject(AttendanceService);
  private native = inject(NativeService);

  readonly today = new Date();
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly items = signal<WFHApplication[]>([]);
  readonly error = signal<string | null>(null);
  readonly sheetOpen = signal(false);
  readonly statusFilter = signal<StatusFilter>('all');

  readonly statusChips: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
  ];

  readonly isFlexible = computed(
    () => this.auth.currentUserSignal()?.employee?.wfh_flexible === true,
  );

  readonly statusCounts = computed(() => {
    const counts: Record<string, number> = { all: this.items().length };
    for (const i of this.items()) {
      counts[i.status] = (counts[i.status] || 0) + 1;
    }
    return counts;
  });

  readonly filteredItems = computed(() => {
    const f = this.statusFilter();
    if (f === 'all') return this.items();
    return this.items().filter((i) => i.status === f);
  });

  readonly form = this.fb.group({
    date: [null as Date | null, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3)]],
  });

  // UUID guard (same pattern as other mobile pages).
  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private get employeePublicId(): string | null {
    const emp: any = this.auth.currentUserSignal()?.employee;
    const pid = emp?.public_id;
    if (typeof pid !== 'string') return null;
    return MobileWfhComponent.UUID_RE.test(pid) ? pid : null;
  }

  ngOnInit(): void {
    if (!this.employeePublicId) {
      this.auth.getCurrentUser().subscribe({
        next: () => this.load(),
        error: () => this.load(),
      });
    } else {
      this.load();
    }
  }

  private load(): void {
    this.loading.set(true);
    // Staff auto-scoped by JWT on backend; match leave list pattern to sidestep
    // stale / non-UUID cached public_ids and still only show my own requests.
    this.attendance.getWFHApplications({ page: 1, limit: 30 }).subscribe({
      next: (res: any) => {
        // Backend responds with either `data: [...]` or `data: { wfh_applications: [...] }`.
        const raw = res?.data;
        const all: WFHApplication[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.wfh_applications)
            ? raw.wfh_applications
            : Array.isArray(raw?.data)
              ? raw.data
              : [];

        const myIntId = this.auth.currentUserSignal()?.employee?.id;
        const mine = myIntId
          ? all.filter((w) => w.employee_id === myIntId || w.employee?.id === myIntId)
          : all;
        this.items.set(mine);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }

  openSheet(): void {
    this.error.set(null);
    this.form.reset({ date: null, reason: '' });
    this.sheetOpen.set(true);
    this.native.hapticLight();
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
  }

  setStatusFilter(s: StatusFilter): void {
    this.statusFilter.set(s);
  }

  private toIsoDate(d: Date | string | null): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    const id = this.employeePublicId;
    if (!id) {
      this.error.set('Employee profile not found.');
      return;
    }

    const date = this.toIsoDate(this.form.value.date ?? null);
    if (!date) {
      this.error.set('Please pick a valid date.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.native.hapticMedium();

    this.attendance
      .applyWFH({ employee_id: id as any, date, reason: this.form.value.reason! })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.form.reset();
          this.closeSheet();
          this.load();
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.message || 'Failed to submit request.');
        },
      });
  }

  statusChip(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default:
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }
  }

  formatDate(s: string): string {
    return new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }
  formatDay(s: string): string {
    return new Date(s).getDate().toString();
  }
  formatMonth(s: string): string {
    return new Date(s).toLocaleDateString([], { month: 'short' });
  }
}
