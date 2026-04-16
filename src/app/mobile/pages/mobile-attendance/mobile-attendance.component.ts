import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@/core/services/auth.service';
import { AttendanceService } from '@/features/attendance/services/attendance.service';
import type { Attendance } from '@/features/attendance/models/attendance.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { NativeService } from '@/mobile/services/native.service';
import { LocationService } from '@/mobile/services/location.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

type ListTab = 'mine' | 'all';
type SheetTab = 'clock' | 'wfh';
type StatusTab = 'in' | 'out';
type AttendanceType = 'Office' | 'WFH';

@Component({
  selector: 'app-mobile-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardIconComponent,
    MobilePageHeaderComponent,
    MobileEmptyStateComponent,
  ],
  template: `
    <section class="space-y-5 pb-24">
      <app-mobile-page-header title="Attendance" subtitle="Track your daily presence">
        <button
          slot="action"
          type="button"
          (click)="openSheet()"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-500/30 active:scale-95 transition"
          aria-label="Add attendance"
        >
          <z-icon zType="plus" zSize="sm"></z-icon>
        </button>
      </app-mobile-page-header>

      <!-- Live status hero card -->
      <button
        type="button"
        (click)="openSheet()"
        class="block w-full text-left relative overflow-hidden rounded-3xl p-5 text-white shadow-xl shadow-indigo-500/10 active:scale-[0.99] transition"
        [class]="isClockedIn() ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700' : 'bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-700'"
      >
        <div class="flex items-baseline gap-1 font-bold tabular-nums tracking-tight">
          <span class="text-5xl">{{ timeString() }}</span>
          <span class="text-xl opacity-60">:{{ secondsString() }}</span>
        </div>
        <p class="mt-1 text-sm opacity-80">{{ dateString() }}</p>

        <div class="mt-4 flex items-center justify-between">
          <div class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <span
              class="h-1.5 w-1.5 rounded-full"
              [class]="isClockedIn() ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'"
            ></span>
            @if (isClockedIn()) {
              <span>Clocked in · {{ duration() }}</span>
            } @else if (today()) {
              <span>Day completed</span>
            } @else {
              <span>Not clocked in yet</span>
            }
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-semibold opacity-90">
            Tap to {{ isClockedIn() ? 'clock out' : 'open' }}
            <z-icon zType="chevron-right" zSize="sm"></z-icon>
          </span>
        </div>
      </button>

      <!-- List view tabs: Mine | All -->
      <div class="flex items-center rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
        <button
          type="button"
          (click)="setListTab('mine')"
          class="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition"
          [class]="listTab() === 'mine' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
        >
          My Recent
        </button>
        <button
          type="button"
          (click)="setListTab('all')"
          class="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition"
          [class]="listTab() === 'all' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
        >
          All Staff
        </button>
      </div>

      <!-- Status tabs: In | Out -->
      <div class="flex items-center rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
        <button
          type="button"
          (click)="setStatusTab('in')"
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition"
          [class]="statusTab() === 'in' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
        >
          <span class="h-2 w-2 rounded-full"
            [class]="statusTab() === 'in' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'"></span>
          <span>In</span>
          <span class="ml-1 rounded-full bg-neutral-200 px-1.5 text-[11px] font-semibold tabular-nums text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
            {{ clockedInList().length }}
          </span>
        </button>
        <button
          type="button"
          (click)="setStatusTab('out')"
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition"
          [class]="statusTab() === 'out' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
        >
          <span class="h-2 w-2 rounded-full bg-neutral-400"></span>
          <span>Out</span>
          <span class="ml-1 rounded-full bg-neutral-200 px-1.5 text-[11px] font-semibold tabular-nums text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
            {{ clockedOutList().length }}
          </span>
        </button>
      </div>

      <!-- Filtered list -->
      <div>
        @if (loadingHistory()) {
          <div class="py-10 text-center text-sm text-neutral-400">Loading…</div>
        } @else if (filteredList().length === 0) {
          <app-mobile-empty-state
            icon="clock"
            [title]="statusTab() === 'in' ? 'No one currently clocked in' : 'No completed records'"
            [subtitle]="listTab() === 'mine' ? 'Your records will appear here.' : 'Staff records will appear here.'"
          />
        } @else {
          <div class="space-y-2">
            @for (record of filteredList(); track record.id) {
              <div class="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
                <div class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                  [class]="record.clock_out_time ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'">
                  {{ initials(record.employee?.full_name) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {{ record.employee?.full_name || 'You' }}
                  </p>
                  <div class="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                    <z-icon zType="clock" zSize="sm" class="h-3 w-3 opacity-60"></z-icon>
                    <span class="tabular-nums text-neutral-700 dark:text-neutral-300">{{ formatTime(record.clock_in_time) }}</span>
                    <span class="text-neutral-300">→</span>
                    <span class="tabular-nums text-neutral-700 dark:text-neutral-300">{{ record.clock_out_time ? formatTime(record.clock_out_time) : '—' }}</span>
                    <span class="text-neutral-300">·</span>
                    <span>{{ record.type }}</span>
                  </div>
                </div>
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  [class]="record.clock_out_time ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'"
                >
                  {{ record.clock_out_time ? 'Out' : 'In' }}
                </span>
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
        <!-- Drag handle -->
        <div class="flex justify-center pt-3 pb-1">
          <span class="h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-2 pb-3">
          <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">Add Attendance</h3>
          <button
            type="button"
            (click)="closeSheet()"
            class="h-8 w-8 inline-flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <z-icon zType="x" zSize="sm"></z-icon>
          </button>
        </div>

        <!-- Sheet tabs -->
        <div class="px-5">
          <div class="flex items-center rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              type="button"
              (click)="setSheetTab('clock')"
              class="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition"
              [class]="sheetTab() === 'clock' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
            >
              <z-icon zType="clock" zSize="sm" class="inline-block mr-1"></z-icon>
              Clock In/Out
            </button>
            <button
              type="button"
              (click)="setSheetTab('wfh')"
              class="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition"
              [class]="sheetTab() === 'wfh' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
            >
              <z-icon zType="home" zSize="sm" class="inline-block mr-1"></z-icon>
              WFH Request
            </button>
          </div>
        </div>

        <!-- Alerts -->
        @if (sheetError()) {
          <div class="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {{ sheetError() }}
          </div>
        }
        @if (sheetSuccess()) {
          <div class="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            {{ sheetSuccess() }}
          </div>
        }

        <!-- ===== Clock Tab ===== -->
        @if (sheetTab() === 'clock') {
          <div class="px-5 py-5 space-y-5">
            <!-- Live time -->
            <div class="rounded-2xl bg-neutral-50 p-4 text-center dark:bg-neutral-800/40">
              <p class="text-xs text-neutral-500">{{ dateString() }}</p>
              <p class="mt-1 text-3xl font-bold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
                {{ timeString() }}<span class="text-base text-neutral-400">:{{ secondsString() }}</span>
              </p>
              <div class="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-[11px] font-medium"
                [class]="isClockedIn() ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'">
                <span class="h-1.5 w-1.5 rounded-full"
                  [class]="isClockedIn() ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'"></span>
                {{ isClockedIn() ? 'Clocked in · ' + duration() : (today() ? 'Day completed' : 'Not clocked in') }}
              </div>
            </div>

            <!-- Type segment (locked once clocked in) -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Attendance Type</label>
              <div class="flex items-center rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
                <button
                  type="button"
                  (click)="setAttendanceType('Office')"
                  [disabled]="!!today()"
                  class="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-60"
                  [class]="attendanceType() === 'Office' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
                >
                  <z-icon zType="building" zSize="sm" class="inline-block mr-1"></z-icon>
                  Office
                </button>
                <button
                  type="button"
                  (click)="setAttendanceType('WFH')"
                  [disabled]="!!today()"
                  class="flex-1 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-60"
                  [class]="attendanceType() === 'WFH' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
                >
                  <z-icon zType="home" zSize="sm" class="inline-block mr-1"></z-icon>
                  WFH
                </button>
              </div>
              @if (today()) {
                <p class="mt-1 text-[11px] text-neutral-500">Locked after clock in</p>
              }
            </div>

            <!-- Todo notes -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">To-Do Notes</label>
              <textarea
                rows="3"
                [(ngModel)]="todoNotesModel"
                placeholder="What are you working on today?"
                class="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              ></textarea>
            </div>

            <!-- Action -->
            @if (!today() || isClockedIn()) {
              <button
                type="button"
                (click)="toggleClock()"
                [disabled]="loading()"
                class="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-lg active:scale-[0.98] transition disabled:opacity-60"
                [class]="isClockedIn() ? 'bg-rose-600 shadow-rose-500/30' : 'bg-emerald-600 shadow-emerald-500/30'"
              >
                @if (loading()) {
                  <z-icon zType="loader-circle" zSize="sm" class="animate-spin"></z-icon>
                  <span>Processing…</span>
                } @else {
                  <z-icon [zType]="isClockedIn() ? 'log-out' : 'log-in'" zSize="sm"></z-icon>
                  <span>{{ isClockedIn() ? 'Clock Out' : 'Clock In' }}</span>
                }
              </button>
            } @else {
              <div class="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <z-icon zType="circle-check" zSize="sm"></z-icon>
                Day completed
              </div>
            }
          </div>
        }

        <!-- ===== WFH Tab ===== -->
        @if (sheetTab() === 'wfh') {
          <div class="px-5 py-5 space-y-5">
            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Date</label>
              <input
                type="date"
                [(ngModel)]="wfhDateModel"
                [min]="todayIso"
                class="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Reason</label>
              <textarea
                rows="4"
                [(ngModel)]="wfhReasonModel"
                placeholder="Why do you need to work from home?"
                class="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              ></textarea>
            </div>

            <button
              type="button"
              (click)="submitWfh()"
              [disabled]="loading() || !wfhDateModel || !wfhReasonModel.trim()"
              class="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition disabled:opacity-60"
            >
              @if (loading()) {
                <z-icon zType="loader-circle" zSize="sm" class="animate-spin"></z-icon>
                <span>Submitting…</span>
              } @else {
                <z-icon zType="plus" zSize="sm"></z-icon>
                <span>Submit WFH Request</span>
              }
            </button>
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileAttendanceComponent implements OnInit {
  private auth = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private location = inject(LocationService);
  private native = inject(NativeService);
  private destroyRef = inject(DestroyRef);

  private now = signal<Date>(new Date());

  readonly loading = signal(false);
  readonly loadingHistory = signal(false);
  readonly today = signal<Attendance | null>(null);
  readonly history = signal<Attendance[]>([]);
  readonly allToday = signal<Attendance[]>([]);

  // Sheet state
  readonly sheetOpen = signal(false);
  readonly sheetTab = signal<SheetTab>('clock');
  readonly sheetError = signal<string | null>(null);
  readonly sheetSuccess = signal<string | null>(null);

  // Forms
  readonly attendanceType = signal<AttendanceType>('Office');
  todoNotesModel = '';
  wfhDateModel = '';
  wfhReasonModel = '';

  // List + status tabs
  readonly listTab = signal<ListTab>('mine');
  readonly statusTab = signal<StatusTab>('in');

  readonly todayIso = new Date().toISOString().split('T')[0];

  readonly isClockedIn = computed(() => {
    const t = this.today();
    return !!t && !t.clock_out_time;
  });

  readonly timeString = computed(() =>
    this.now().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
  );

  readonly secondsString = computed(() => this.now().getSeconds().toString().padStart(2, '0'));

  readonly dateString = computed(() =>
    this.now().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }),
  );

  readonly duration = computed(() => {
    const t = this.today();
    if (!t) return '';
    const start = new Date(t.clock_in_time).getTime();
    const end = t.clock_out_time ? new Date(t.clock_out_time).getTime() : this.now().getTime();
    const ms = Math.max(0, end - start);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  });

  // Source list switches between own history and all-staff today
  private readonly sourceList = computed(() =>
    this.listTab() === 'mine' ? this.history() : this.allToday(),
  );

  readonly clockedInList = computed(() =>
    this.sourceList().filter((r) => !r.clock_out_time),
  );

  readonly clockedOutList = computed(() =>
    this.sourceList().filter((r) => !!r.clock_out_time),
  );

  readonly filteredList = computed(() =>
    this.statusTab() === 'in' ? this.clockedInList() : this.clockedOutList(),
  );

  ngOnInit(): void {
    const id = setInterval(() => this.now.set(new Date()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(id));

    // Refresh user from API if employee.public_id is missing in cached session
    // (older logins stored before the public_id column existed).
    if (!this.employeePublicId) {
      this.auth.getCurrentUser().subscribe({
        next: () => {
          this.loadToday();
          this.loadHistory();
        },
        error: () => {
          this.loadToday();
          this.loadHistory();
        },
      });
    } else {
      this.loadToday();
      this.loadHistory();
    }
  }

  // Backend resolves `employee_id` (in body or query) as the Employee.public_id UUID.
  // Sending the integer PK triggers "operator does not exist: uuid = integer".
  // Guard: must be a UUID-shaped string, otherwise treat as missing so a
  // /auth/me refresh repopulates it.
  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private get employeePublicId(): string | null {
    const emp: any = this.auth.currentUserSignal()?.employee;
    const pid = emp?.public_id;
    if (typeof pid !== 'string') return null;
    return MobileAttendanceComponent.UUID_RE.test(pid) ? pid : null;
  }

  private extractList(res: any): Attendance[] {
    if (!res) return [];
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.attendance && Array.isArray(res.data.attendance)) return res.data.attendance;
    if (Array.isArray(res.attendance)) return res.attendance;
    return [];
  }

  private loadToday(): void {
    const id = this.employeePublicId;
    if (!id) return;
    this.attendanceService.getTodayAttendance(id).subscribe({
      next: (res) => {
        const list = this.extractList(res);
        const record = list[0] ?? null;
        this.today.set(record);
        if (record) {
          this.attendanceType.set(record.type);
          this.todoNotesModel = record.todo_notes ?? '';
        }
      },
      error: () => this.today.set(null),
    });
  }

  private loadHistory(): void {
    this.loadingHistory.set(true);

    if (this.listTab() === 'mine') {
      const id = this.employeePublicId;
      if (!id) {
        this.loadingHistory.set(false);
        return;
      }
      this.attendanceService
        .getAllAttendance({ employee_id: id, page: 1, limit: 10 })
        .subscribe({
          next: (res) => {
            this.history.set(this.extractList(res));
            this.loadingHistory.set(false);
          },
          error: () => this.loadingHistory.set(false),
        });
    } else {
      this.attendanceService
        .getAllAttendance({
          page: 1,
          limit: 50,
          start_date: this.todayIso,
          end_date: this.todayIso,
        })
        .subscribe({
          next: (res) => {
            this.allToday.set(this.extractList(res));
            this.loadingHistory.set(false);
          },
          error: () => this.loadingHistory.set(false),
        });
    }
  }

  setListTab(tab: ListTab): void {
    if (this.listTab() === tab) return;
    this.listTab.set(tab);
    this.loadHistory();
  }

  setStatusTab(tab: StatusTab): void {
    this.statusTab.set(tab);
  }

  openSheet(): void {
    this.sheetError.set(null);
    this.sheetSuccess.set(null);
    this.wfhDateModel = this.todayIso;
    this.wfhReasonModel = '';
    this.sheetOpen.set(true);
    this.native.hapticLight?.();
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
  }

  setSheetTab(tab: SheetTab): void {
    this.sheetTab.set(tab);
    this.sheetError.set(null);
    this.sheetSuccess.set(null);
  }

  setAttendanceType(t: AttendanceType): void {
    if (this.today()) return;
    this.attendanceType.set(t);
  }

  async toggleClock(): Promise<void> {
    const id = this.employeePublicId;
    if (!id) {
      this.sheetError.set('Employee profile not found.');
      return;
    }
    this.sheetError.set(null);
    this.sheetSuccess.set(null);
    this.loading.set(true);
    this.native.hapticMedium?.();

    const coords = await this.location.getCurrent();

    if (this.isClockedIn()) {
      const payload = {
        employee_id: id,
        ...(coords && {
          location_lat: coords.latitude,
          location_long: coords.longitude,
        }),
      };
      this.attendanceService.clockOut(payload).subscribe({
        next: (res) => {
          this.today.set(res.data ?? null);
          this.loading.set(false);
          this.sheetSuccess.set('Clocked out successfully.');
          this.loadHistory();
          setTimeout(() => this.closeSheet(), 800);
        },
        error: (err) => {
          this.loading.set(false);
          this.sheetError.set(err?.message || 'Unable to clock out.');
        },
      });
    } else {
      const payload = {
        employee_id: id,
        type: this.attendanceType(),
        todo_notes: this.todoNotesModel || undefined,
        ...(coords && {
          location_lat: coords.latitude,
          location_long: coords.longitude,
        }),
      };
      this.attendanceService.clockIn(payload).subscribe({
        next: (res) => {
          this.today.set(res.data ?? null);
          this.loading.set(false);
          this.sheetSuccess.set('Clocked in successfully.');
          this.loadHistory();
          setTimeout(() => this.closeSheet(), 800);
        },
        error: (err) => {
          this.loading.set(false);
          this.sheetError.set(err?.message || 'Unable to clock in.');
        },
      });
    }
  }

  submitWfh(): void {
    const id = this.employeePublicId;
    if (!id) {
      this.sheetError.set('Employee profile not found.');
      return;
    }
    if (!this.wfhDateModel || !this.wfhReasonModel.trim()) return;

    this.sheetError.set(null);
    this.sheetSuccess.set(null);
    this.loading.set(true);

    this.attendanceService
      .applyWFH({
        employee_id: id,
        date: this.wfhDateModel,
        reason: this.wfhReasonModel.trim(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.sheetSuccess.set('WFH request submitted.');
          this.wfhReasonModel = '';
          setTimeout(() => this.closeSheet(), 1000);
        },
        error: (err) => {
          this.loading.set(false);
          this.sheetError.set(err?.message || 'Unable to submit WFH request.');
        },
      });
  }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  formatTime(ts: string): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  formatDay(ts: string): string {
    return new Date(ts).getDate().toString();
  }

  formatMonth(ts: string): string {
    return new Date(ts).toLocaleDateString([], { month: 'short' });
  }
}
