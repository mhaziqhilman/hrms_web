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
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '@/core/services/auth.service';
import { CompanyService } from '@/core/services/company.service';
import type { Company } from '@/core/models/auth.models';
import { NativeService } from '@/mobile/services/native.service';
import { LocationService } from '@/mobile/services/location.service';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';
import { LeaveService } from '@/features/leave/services/leave.service';
import { LeaveStatus } from '@/features/leave/models/leave.model';
import { ClaimService } from '@/features/claims/services/claim.service';
import { AttendanceService } from '@/features/attendance/services/attendance.service';
import type { Attendance } from '@/features/attendance/models/attendance.model';
import { MemoService } from '@/features/communication/services/memo.service';
import type { Memo } from '@/features/communication/models/memo.model';
import { NotificationService } from '@/core/services/notification.service';
import type {
  Notification,
  NotificationType,
} from '@/core/models/notification.models';
import { TimeAgoPipe } from '@/shared/pipes/time-ago.pipe';

interface QuickAction {
  path: string;
  label: string;
  sublabel: string;
  icon: ZardIcon;
  tone: 'emerald' | 'sky' | 'amber' | 'violet';
}

const DISMISSED_MEMOS_KEY = 'mobile-home-dismissed-memos';
const APPROVAL_BAR_CAP = 10;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-mobile-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardIconComponent, TimeAgoPipe],
  templateUrl: './mobile-home.component.html',
  styleUrls: ['./mobile-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileHomeComponent implements OnInit {
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  protected native = inject(NativeService);
  private location = inject(LocationService);
  private leaveService = inject(LeaveService);
  private claimService = inject(ClaimService);
  private attendanceService = inject(AttendanceService);
  private memoService = inject(MemoService);
  private notificationService = inject(NotificationService);
  private companyService = inject(CompanyService);

  readonly user = this.auth.currentUserSignal;
  readonly company = signal<Company | null>(null);

  readonly companyInitial = computed(() => {
    const name = this.company()?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : '';
  });

  readonly companyShortName = computed(() => {
    const name = this.company()?.name?.trim();
    if (!name) return '';
    return name.split(/\s+/).slice(0, 2).join(' ');
  });

  private readonly now = signal<Date>(new Date());

  readonly today = signal<Attendance | null>(null);
  readonly clockLoading = signal(false);
  readonly clockError = signal<string | null>(null);

  readonly greeting = computed(() => {
    const hour = this.now().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  readonly timeString = computed(() => {
    const d = this.now();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  readonly secondsString = computed(() => {
    const s = this.now().getSeconds();
    return s.toString().padStart(2, '0');
  });

  readonly dateString = computed(() =>
    this.now().toLocaleDateString([], {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly isClockedIn = computed(() => {
    const t = this.today();
    return !!t && !t.clock_out_time;
  });

  readonly isDayCompleted = computed(() => {
    const t = this.today();
    return !!t && !!t.clock_out_time;
  });

  readonly workedDuration = computed(() => {
    const t = this.today();
    if (!t) return null;
    const start = new Date(t.clock_in_time).getTime();
    const end = t.clock_out_time ? new Date(t.clock_out_time).getTime() : this.now().getTime();
    const ms = Math.max(0, end - start);
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  });

  readonly clockedInTime = computed(() => {
    const t = this.today();
    if (!t?.clock_in_time) return null;
    return new Date(t.clock_in_time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  });

  readonly isManager = computed(() => {
    const role = this.user()?.role;
    return role === 'manager' || role === 'admin' || role === 'super_admin';
  });

  readonly announcement = signal<Memo | null>(null);
  readonly announcementLoading = signal(false);

  readonly leaveTotal = signal(0);
  readonly leaveUsed = signal(0);
  readonly leaveBalanceLoaded = signal(false);
  readonly leaveRemaining = computed(() =>
    Math.max(this.leaveTotal() - this.leaveUsed(), 0),
  );
  readonly leavePercent = computed(() => {
    const total = this.leaveTotal();
    if (!total) return 0;
    return Math.round((this.leaveRemaining() / total) * 100);
  });

  readonly recentNotifications = this.notificationService.notifications;
  readonly recentLoaded = signal(false);

  readonly approvalsPending = signal(0);
  readonly approvalsLoaded = signal(false);
  readonly approvalsBarPercent = computed(() => {
    const pending = this.approvalsPending();
    if (!pending) return 0;
    return Math.min(Math.round((pending / APPROVAL_BAR_CAP) * 100), 100);
  });

  readonly quickActions: QuickAction[] = [
    {
      path: '/m/leave',
      label: 'Apply Leave',
      sublabel: 'Annual, sick, others',
      icon: 'calendar',
      tone: 'sky',
    },
    {
      path: '/m/claims',
      label: 'New Claim',
      sublabel: 'Snap a receipt',
      icon: 'receipt-text',
      tone: 'amber',
    },
    {
      path: '/m/wfh',
      label: 'WFH Request',
      sublabel: 'Work from home',
      icon: 'house',
      tone: 'violet',
    },
    {
      path: '/m/payslip',
      label: 'Payslips',
      sublabel: 'View & download',
      icon: 'wallet',
      tone: 'emerald',
    },
  ];

  ngOnInit(): void {
    const id = setInterval(() => this.now.set(new Date()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(id));

    if (!this.employeePublicId) {
      this.auth.getCurrentUser().subscribe({
        next: () => this.loadToday(),
        error: () => this.loadToday(),
      });
    } else {
      this.loadToday();
    }

    this.loadAnnouncement();
    this.loadLeaveBalance();
    this.loadRecent();
    this.loadCompany();
    if (this.isManager()) {
      this.loadApprovals();
    }
  }

  private loadCompany(): void {
    const fromUser = this.user()?.company ?? null;
    if (fromUser) this.company.set(fromUser);
    if (!this.user()?.company_id) return;

    this.companyService
      .getMyCompany()
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (res?.success && res.data) {
          this.company.set(res.data);
        }
      });
  }

  private loadRecent(): void {
    this.notificationService.loadRecentNotifications();
    queueMicrotask(() => this.recentLoaded.set(true));
  }

  iconForNotification(type: NotificationType): ZardIcon {
    switch (type) {
      case 'leave_approved':
      case 'leave_rejected':
        return 'calendar';
      case 'claim_approved':
      case 'claim_rejected':
      case 'claim_finance_approved':
      case 'claim_finance_rejected':
        return 'receipt-text';
      case 'wfh_approved':
      case 'wfh_rejected':
        return 'house';
      case 'announcement_published':
        return 'message-square';
      case 'policy_published':
        return 'file-text';
      case 'team_member_joined':
        return 'user-plus';
      default:
        return 'alert-circle';
    }
  }

  toneForNotification(type: NotificationType): 'sky' | 'amber' | 'violet' | 'emerald' | 'rose' {
    if (type.endsWith('_rejected')) return 'rose';
    if (type.endsWith('_approved')) return 'emerald';
    if (type.startsWith('claim')) return 'amber';
    if (type.startsWith('wfh')) return 'violet';
    if (type.startsWith('leave')) return 'sky';
    return 'sky';
  }

  trackNotification(_index: number, n: Notification): number {
    return n.id;
  }

  private get employeePublicId(): string | null {
    const emp: any = this.auth.currentUserSignal()?.employee;
    const pid = emp?.public_id;
    if (typeof pid !== 'string') return null;
    return UUID_RE.test(pid) ? pid : null;
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
        this.today.set(list[0] ?? null);
      },
      error: () => this.today.set(null),
    });
  }

  async toggleClock(): Promise<void> {
    if (this.clockLoading()) return;
    if (this.isDayCompleted()) return;

    const id = this.employeePublicId;
    if (!id) {
      this.showClockError('Employee profile not found.');
      return;
    }

    this.clockError.set(null);
    this.clockLoading.set(true);
    this.native.hapticMedium();

    const coords = await this.location.getCurrent();

    if (this.isClockedIn()) {
      this.attendanceService
        .clockOut({
          employee_id: id,
          ...(coords && {
            location_lat: coords.latitude,
            location_long: coords.longitude,
          }),
        })
        .subscribe({
          next: (res) => {
            this.today.set(res.data ?? null);
            this.clockLoading.set(false);
          },
          error: (err) => {
            this.clockLoading.set(false);
            this.showClockError(err?.error?.message || err?.message || 'Unable to clock out.');
          },
        });
    } else {
      this.attendanceService
        .clockIn({
          employee_id: id,
          type: 'Office',
          ...(coords && {
            location_lat: coords.latitude,
            location_long: coords.longitude,
          }),
        })
        .subscribe({
          next: (res) => {
            this.today.set(res.data ?? null);
            this.clockLoading.set(false);
          },
          error: (err) => {
            this.clockLoading.set(false);
            this.showClockError(err?.error?.message || err?.message || 'Unable to clock in.');
          },
        });
    }
  }

  private showClockError(msg: string): void {
    this.clockError.set(msg);
    setTimeout(() => {
      if (this.clockError() === msg) this.clockError.set(null);
    }, 4000);
  }

  dismissAnnouncement(): void {
    const current = this.announcement();
    if (!current) return;
    this.native.hapticLight();
    this.addDismissedMemo(current.id);
    this.announcement.set(null);
  }

  private loadAnnouncement(): void {
    this.announcementLoading.set(true);
    const dismissed = this.getDismissedMemos();

    this.memoService
      .getAllMemos({ status: 'Published', sort_by: 'newest', limit: 5 })
      .pipe(
        map((res) => res.data.find((m) => !dismissed.includes(m.id)) ?? null),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((memo) => {
        this.announcement.set(memo);
        this.announcementLoading.set(false);
      });
  }

  private loadLeaveBalance(): void {
    const employeeId = this.user()?.employee?.id;
    if (!employeeId) {
      this.leaveBalanceLoaded.set(true);
      return;
    }

    this.leaveService
      .getLeaveBalance(employeeId)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (res?.success && res.data?.entitlements) {
          const total = res.data.entitlements.reduce((s, e) => s + (e.total_days ?? 0), 0);
          const used = res.data.entitlements.reduce(
            (s, e) => s + (e.used_days ?? 0) + (e.pending_days ?? 0),
            0,
          );
          this.leaveTotal.set(total);
          this.leaveUsed.set(used);
        }
        this.leaveBalanceLoaded.set(true);
      });
  }

  private loadApprovals(): void {
    const leaves$ = this.leaveService
      .getLeaves({ status: LeaveStatus.PENDING, limit: 1 })
      .pipe(
        map((res) => res.data?.pagination?.total ?? 0),
        catchError(() => of(0)),
      );

    const claims$ = this.claimService
      .getAllClaims({ status: 'Pending', limit: 1 })
      .pipe(
        map((res) => res.pagination?.total ?? 0),
        catchError(() => of(0)),
      );

    const wfh$ = this.attendanceService
      .getAllWFH({ status: 'Pending', limit: 1 })
      .pipe(
        map((res) => res.pagination?.total ?? 0),
        catchError(() => of(0)),
      );

    forkJoin([leaves$, claims$, wfh$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([leaves, claims, wfh]) => {
        this.approvalsPending.set(leaves + claims + wfh);
        this.approvalsLoaded.set(true);
      });
  }

  private getDismissedMemos(): number[] {
    try {
      const raw = localStorage.getItem(DISMISSED_MEMOS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'number') : [];
    } catch {
      return [];
    }
  }

  private addDismissedMemo(id: number): void {
    try {
      const list = this.getDismissedMemos();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(DISMISSED_MEMOS_KEY, JSON.stringify(list.slice(-50)));
      }
    } catch {
      /* storage unavailable — ignore */
    }
  }
}
