import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationService } from '@/core/services/notification.service';
import type { Notification } from '@/core/models/notification.models';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';
import { NativeService } from '@/mobile/services/native.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

@Component({
  selector: 'app-mobile-notifications',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, MobilePageHeaderComponent, MobileEmptyStateComponent],
  template: `
    <section class="space-y-5">
      <app-mobile-page-header title="Notifications" [subtitle]="subtitle()">
        @if (unreadCount() > 0) {
          <button
            slot="action"
            (click)="markAll()"
            class="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 active:scale-95 transition"
          >
            Mark all read
          </button>
        }
      </app-mobile-page-header>

      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-16 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <app-mobile-empty-state icon="bell" title="You're all caught up" subtitle="New activity will appear here." />
      } @else {
        <div class="space-y-2">
          @for (n of items(); track n.id) {
            <button
              type="button"
              (click)="handleTap(n)"
              class="flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-98"
              [class]="n.is_read
                ? 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                : 'border-violet-200 bg-violet-50/50 dark:border-violet-900/50 dark:bg-violet-950/20'"
            >
              <div
                class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                [class]="typeIconBg(n.type)"
              >
                <z-icon [zType]="typeIcon(n.type)" zSize="sm" [class]="typeIconColor(n.type)"></z-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{{ n.title }}</span>
                  @if (!n.is_read) {
                    <span class="h-1.5 w-1.5 rounded-full bg-violet-500"></span>
                  }
                </div>
                <p class="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{{ n.message }}</p>
                <p class="mt-1 text-[11px] text-neutral-400">{{ timeAgo(n.created_at) }}</p>
              </div>
            </button>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNotificationsComponent implements OnInit {
  private service = inject(NotificationService);
  private native = inject(NativeService);

  readonly items = this.service.notifications;
  readonly loading = this.service.loading;
  readonly unreadCount = this.service.unreadCount;

  readonly subtitle = computed(() => {
    const c = this.unreadCount();
    return c > 0 ? `${c} unread` : 'All caught up';
  });

  ngOnInit(): void {
    this.service.loadNotifications({ page: 1, limit: 30 });
  }

  handleTap(n: Notification): void {
    this.native.hapticLight();
    if (!n.is_read) this.service.markAsRead(n.id);
  }

  markAll(): void {
    this.native.hapticLight();
    this.service.markAllAsRead();
  }

  typeIcon(type: string): ZardIcon {
    if (type.startsWith('leave_')) return 'calendar';
    if (type.startsWith('claim_')) return 'receipt-text';
    if (type.startsWith('wfh_')) return 'house';
    if (type.startsWith('payroll_')) return 'wallet';
    if (type.startsWith('announcement_')) return 'send';
    if (type.startsWith('policy_')) return 'file-text';
    if (type.startsWith('team_')) return 'users';
    return 'bell';
  }

  typeIconBg(type: string): string {
    if (type.includes('approved') || type.includes('paid')) return 'bg-emerald-100 dark:bg-emerald-950/40';
    if (type.includes('rejected')) return 'bg-rose-100 dark:bg-rose-950/40';
    if (type.startsWith('claim_')) return 'bg-amber-100 dark:bg-amber-950/40';
    if (type.startsWith('wfh_')) return 'bg-violet-100 dark:bg-violet-950/40';
    if (type.startsWith('announcement_') || type.startsWith('policy_')) return 'bg-sky-100 dark:bg-sky-950/40';
    return 'bg-neutral-100 dark:bg-neutral-800';
  }

  typeIconColor(type: string): string {
    if (type.includes('approved') || type.includes('paid')) return 'text-emerald-700 dark:text-emerald-300';
    if (type.includes('rejected')) return 'text-rose-700 dark:text-rose-300';
    if (type.startsWith('claim_')) return 'text-amber-700 dark:text-amber-300';
    if (type.startsWith('wfh_')) return 'text-violet-700 dark:text-violet-300';
    if (type.startsWith('announcement_') || type.startsWith('policy_')) return 'text-sky-700 dark:text-sky-300';
    return 'text-neutral-600 dark:text-neutral-400';
  }

  timeAgo(ts: string): string {
    const ms = Date.now() - new Date(ts).getTime();
    const m = Math.floor(ms / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' });
  }
}
