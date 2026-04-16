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
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '@/core/services/auth.service';
import { LeaveService } from '@/features/leave/services/leave.service';
import { LEAVE_TYPE_COLORS, type LeaveType } from '@/features/leave/models/leave.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { FileService } from '@/core/services/file.service';
import { NativeService } from '@/mobile/services/native.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';

interface TypeOption {
  id: number;
  name: string;
  total: number;
  used: number;
  pending: number;
  balance: number;
  color: string;
  hasEntitlement: boolean;
}

// Standard rule fallback for leave types that always need documentation.
// API's requires_document flag still wins when true; this only fills in gaps
// where a row was created without the flag (or with the wrong default).
const REQUIRES_DOCUMENT_BY_NAME = new Set<string>([
  'Medical Leave',
  'Hospitalization Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Study Leave',
]);

@Component({
  selector: 'app-mobile-leave-apply',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ZardIconComponent,
    ZardDatePickerComponent,
    MobilePageHeaderComponent,
  ],
  template: `
    <section class="space-y-5 pb-24">
      <app-mobile-page-header title="Apply for leave" subtitle="Submit a new request">
        <a
          slot="action"
          routerLink="/m/leave"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 active:scale-95"
          aria-label="Back"
        >
          <z-icon zType="chevron-left" zSize="default"></z-icon>
        </a>
      </app-mobile-page-header>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <!-- Leave type -->
        <div>
          <label class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Leave type</label>

          @if (loadingTypes()) {
            <div
              class="grid grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-1 no-scrollbar snap-x"
              [style.grid-auto-columns]="'calc((100% - 0.75rem) / 2)'"
            >
              @for (_ of [1,2,3,4]; track $index) {
                <div class="h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800 snap-start"></div>
              }
            </div>
          } @else if (typeOptions().length === 0) {
            <div class="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-center text-sm text-neutral-500">
              No leave types available.
            </div>
          } @else {
            <div
              class="grid grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-1 no-scrollbar snap-x"
              [style.grid-auto-columns]="'calc((100% - 0.75rem) / 2)'"
            >
              @for (type of typeOptions(); track type.id) {
                <button
                  type="button"
                  (click)="selectType(type.id)"
                  class="snap-start rounded-2xl border p-4 text-left transition active:scale-98"
                  [class]="selectedTypeId() === type.id
                    ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/20 dark:bg-violet-950/30'
                    : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <span class="h-2 w-2 rounded-full shrink-0" [style.background-color]="type.color"></span>
                        <p class="truncate text-xs font-semibold"
                          [class]="selectedTypeId() === type.id ? 'text-violet-700 dark:text-violet-300' : 'text-neutral-700 dark:text-neutral-200'">
                          {{ type.name }}
                        </p>
                      </div>
                    </div>
                  </div>

                  @if (type.hasEntitlement) {
                    <div class="mt-2 flex items-baseline gap-1">
                      <span class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 tabular-nums">
                        {{ type.balance }}
                      </span>
                      <span class="text-xs text-neutral-500">/ {{ type.total }} days</span>
                    </div>
                    <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        class="h-full rounded-full transition-all"
                        [style.width.%]="usedPct(type)"
                        [style.background-color]="type.color"
                      ></div>
                    </div>
                    <div class="mt-2 flex justify-between text-[10px] font-medium text-neutral-500">
                      <span>Used {{ type.used }}</span>
                      @if (type.pending > 0) {
                        <span class="text-amber-600 dark:text-amber-400">Pending {{ type.pending }}</span>
                      }
                    </div>
                  } @else {
                    <div class="mt-2 text-xs text-neutral-500">No entitlement</div>
                  }
                </button>
              }
            </div>
          }
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Start date</label>
            <z-date-picker
              formControlName="start_date"
              placeholder="Pick start"
              zFormat="d MMM yyyy"
              class="block w-full"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">End date</label>
            <z-date-picker
              formControlName="end_date"
              placeholder="Pick end"
              zFormat="d MMM yyyy"
              [minDate]="minEndDate()"
              class="block w-full"
            />
          </div>
        </div>

        <!-- Half-day -->
        <label class="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <span class="text-sm font-medium">Half day</span>
          <input type="checkbox" formControlName="is_half_day" class="h-5 w-5 accent-violet-600" />
        </label>

        @if (form.value.is_half_day) {
          <div class="flex gap-2">
            <button
              type="button"
              (click)="form.patchValue({ half_day_period: 'AM' })"
              class="flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition"
              [class]="form.value.half_day_period === 'AM'
                ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                : 'border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400'"
            >Morning</button>
            <button
              type="button"
              (click)="form.patchValue({ half_day_period: 'PM' })"
              class="flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition"
              [class]="form.value.half_day_period === 'PM'
                ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                : 'border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400'"
            >Afternoon</button>
          </div>
        }

        <!-- Reason -->
        <label class="block">
          <span class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Reason</span>
          <textarea
            formControlName="reason"
            rows="4"
            placeholder="Briefly describe your reason"
            class="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15"
          ></textarea>
        </label>

        <!-- Attachment (when leave type requires a supporting document) -->
        @if (requiresDocument()) {
          <div
            class="rounded-2xl border-2 border-dashed p-4 transition"
            [class]="attachmentMissing()
              ? 'border-rose-300 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20'
              : 'border-violet-300 bg-violet-50/40 dark:border-violet-900/60 dark:bg-violet-950/20'"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <z-icon zType="file-text" zSize="sm" class="text-violet-600 dark:text-violet-400"></z-icon>
                  <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Supporting document</span>
                  <span class="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Required
                  </span>
                </div>
                <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {{ selectedTypeName() }} requires you to attach a supporting document
                  (e.g. medical certificate). Image or PDF, up to 10&nbsp;MB.
                </p>
              </div>
            </div>

            @if (attachmentFiles().length === 0) {
              <button
                type="button"
                (click)="filePicker.click()"
                class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/30 active:scale-98 transition"
              >
                <z-icon zType="plus" zSize="sm"></z-icon>
                Choose file
              </button>
            } @else {
              <ul class="mt-3 space-y-2">
                @for (file of attachmentFiles(); track file.name; let i = $index) {
                  <li class="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm dark:bg-neutral-900">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                      <z-icon zType="file-text" zSize="sm"></z-icon>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">{{ file.name }}</p>
                      <p class="text-[11px] text-neutral-500">{{ formatFileSize(file.size) }}</p>
                    </div>
                    <button
                      type="button"
                      (click)="removeFile(i)"
                      class="inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      aria-label="Remove file"
                    >
                      <z-icon zType="x" zSize="sm"></z-icon>
                    </button>
                  </li>
                }
              </ul>
              <button
                type="button"
                (click)="filePicker.click()"
                class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400"
              >
                <z-icon zType="plus" zSize="sm"></z-icon>
                Add another
              </button>
            }

            @if (attachmentMissing()) {
              <p class="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                <z-icon zType="circle-alert" zSize="sm" class="h-3 w-3"></z-icon>
                Attachment is required for this leave type.
              </p>
            }

            <input
              #filePicker
              type="file"
              accept="image/*,.pdf"
              class="hidden"
              (change)="onFileSelected($event)"
            />
          </div>
        }

        @if (error()) {
          <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {{ error() }}
          </div>
        }

        <button
          type="submit"
          [disabled]="form.invalid || submitting()"
          class="w-full rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 active:scale-98 transition disabled:opacity-50"
        >
          @if (submitting()) {
            <span class="inline-flex items-center justify-center gap-2">
              <z-icon zType="loader-circle" zSize="sm" class="animate-spin"></z-icon>
              Submitting…
            </span>
          } @else {
            Submit application
          }
        </button>
      </form>
    </section>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileLeaveApplyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private leaveService = inject(LeaveService);
  private fileService = inject(FileService);
  private router = inject(Router);
  private native = inject(NativeService);

  readonly types = signal<LeaveType[]>([]);
  readonly entitlementMap = signal<Record<number, { total: number; used: number; pending: number; balance: number }>>({});
  readonly loadingTypes = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly attachmentFiles = signal<File[]>([]);
  readonly attemptedSubmit = signal(false);
  // Signal mirror of the form's leave_type_id so `computed()` stays reactive.
  readonly selectedTypeId = signal<number>(0);

  readonly selectedType = computed(() =>
    this.types().find((t) => t.id === this.selectedTypeId()) || null,
  );
  readonly selectedTypeName = computed(() => this.selectedType()?.name || 'This leave type');
  readonly requiresDocument = computed(() => {
    const t = this.selectedType();
    if (!t) return false;
    return t.requires_document === true || REQUIRES_DOCUMENT_BY_NAME.has(t.name);
  });
  readonly attachmentMissing = computed(() =>
    this.requiresDocument() && this.attachmentFiles().length === 0 && this.attemptedSubmit(),
  );

  readonly form = this.fb.group({
    leave_type_id: [0, [Validators.required, Validators.min(1)]],
    start_date: [null as Date | null, Validators.required],
    end_date: [null as Date | null, Validators.required],
    is_half_day: [false],
    half_day_period: ['AM' as 'AM' | 'PM'],
    reason: ['', [Validators.required, Validators.minLength(3)]],
  });

  readonly typeOptions = computed<TypeOption[]>(() => {
    const map = this.entitlementMap();
    return this.types().map((t) => {
      const ent = map[t.id];
      return {
        id: t.id,
        name: t.name,
        total: ent?.total ?? t.days_per_year,
        used: ent?.used ?? 0,
        pending: ent?.pending ?? 0,
        balance: ent?.balance ?? 0,
        color: LEAVE_TYPE_COLORS[t.name] || '#8b5cf6',
        hasEntitlement: !!ent,
      };
    });
  });

  readonly minEndDate = computed<Date | undefined>(() => {
    const s = this.form.value.start_date;
    return s instanceof Date ? s : undefined;
  });

  // UUID guard — same pattern used across mobile pages.
  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private get employeePublicId(): string | null {
    const emp: any = this.auth.currentUserSignal()?.employee;
    const pid = emp?.public_id;
    if (typeof pid !== 'string') return null;
    return MobileLeaveApplyComponent.UUID_RE.test(pid) ? pid : null;
  }

  ngOnInit(): void {
    if (!this.employeePublicId) {
      this.auth.getCurrentUser().subscribe({
        next: () => this.loadTypesAndBalance(),
        error: () => this.loadTypesAndBalance(),
      });
    } else {
      this.loadTypesAndBalance();
    }
  }

  private loadTypesAndBalance(): void {
    this.loadingTypes.set(true);
    const id = this.employeePublicId;

    if (!id) {
      // No employee context — only load types.
      this.leaveService.getLeaveTypes().subscribe({
        next: (res) => {
          this.types.set(res.data || []);
          this.loadingTypes.set(false);
        },
        error: () => this.loadingTypes.set(false),
      });
      return;
    }

    forkJoin({
      types: this.leaveService.getLeaveTypes(),
      balance: this.leaveService.getLeaveBalance(id),
    }).subscribe({
      next: ({ types, balance }) => {
        this.types.set(types.data || []);
        const map: Record<number, { total: number; used: number; pending: number; balance: number }> = {};
        for (const e of balance.data?.entitlements || []) {
          map[e.leave_type.id] = {
            total: e.total_days,
            used: e.used_days,
            pending: e.pending_days,
            balance: e.balance_days,
          };
        }
        this.entitlementMap.set(map);
        this.loadingTypes.set(false);
      },
      error: () => {
        this.loadingTypes.set(false);
      },
    });
  }

  selectType(id: number): void {
    this.native.hapticLight();
    this.selectedTypeId.set(id);
    this.form.patchValue({ leave_type_id: id });
  }

  usedPct(t: TypeOption): number {
    if (t.total <= 0) return 0;
    return Math.min(100, (t.used / t.total) * 100);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const MAX_BYTES = 10 * 1024 * 1024;
    const accepted: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files.item(i);
      if (!f) continue;
      if (f.size > MAX_BYTES) {
        this.error.set(`${f.name} exceeds the 10 MB limit.`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length > 0) {
      this.attachmentFiles.set([...this.attachmentFiles(), ...accepted]);
      this.error.set(null);
    }
    input.value = '';
  }

  removeFile(index: number): void {
    const next = [...this.attachmentFiles()];
    next.splice(index, 1);
    this.attachmentFiles.set(next);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
    this.attemptedSubmit.set(true);
    if (this.form.invalid || this.submitting()) return;

    const id = this.employeePublicId;
    if (!id) {
      this.error.set('Employee profile not found.');
      return;
    }

    if (this.requiresDocument() && this.attachmentFiles().length === 0) {
      this.error.set('Please attach a supporting document for this leave type.');
      return;
    }

    const v = this.form.value;
    const start = this.toIsoDate(v.start_date ?? null);
    const end = this.toIsoDate(v.end_date ?? null);

    if (!start || !end) {
      this.error.set('Please select valid dates.');
      return;
    }
    if (new Date(end) < new Date(start)) {
      this.error.set('End date cannot be before start date.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.native.hapticMedium();

    this.leaveService
      .applyLeave({
        employee_id: id as any,
        leave_type_id: v.leave_type_id!,
        start_date: start,
        end_date: end,
        is_half_day: v.is_half_day ?? false,
        half_day_period: v.is_half_day ? (v.half_day_period as 'AM' | 'PM') : undefined,
        reason: v.reason!,
      })
      .subscribe({
        next: (res) => {
          const newLeaveId = res.data?.id;
          const files = this.attachmentFiles();
          if (newLeaveId && files.length > 0) {
            this.uploadAttachments(newLeaveId, files);
          } else {
            this.submitting.set(false);
            void this.router.navigateByUrl('/m/leave');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err?.message || 'Failed to submit. Please try again.');
        },
      });
  }

  private uploadAttachments(leaveId: number, files: File[]): void {
    this.fileService
      .uploadFiles(files, {
        category: 'leave_document',
        sub_category: 'medical_certificate',
        related_to_leave_id: leaveId,
        description: `Supporting document for leave #${leaveId}`,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.attachmentFiles.set([]);
          void this.router.navigateByUrl('/m/leave');
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(
            err?.error?.message ||
              'Leave submitted, but the attachment failed to upload. Please attach it from the leave details page.',
          );
        },
      });
  }
}
