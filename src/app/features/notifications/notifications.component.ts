import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';

// Services & Models
import { NotificationService } from '@/core/services/notification.service';
import { Notification, NotificationType, NotificationFilters } from '@/core/models/notification.models';
import { TimeAgoPipe } from '@/shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardDividerComponent,
    ZardSkeletonComponent,
    TimeAgoPipe
  ],
  template: `
    <div class="bg-background min-h-screen max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-foreground">Notifications</h1>
        <div class="flex items-center gap-2">
          @if (notificationService.unreadCount() > 0) {
            <button z-button (click)="markAllAsRead()" class="gap-2">
              <z-icon zType="check" class="w-4 h-4" />
              Mark All as Read
            </button>
          }
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3 mb-6 flex-wrap justify-between">
        <div class="flex items-center gap-3 flex-1 flex-wrap">
          <!-- Search Bar -->
          <div class="relative flex-1 min-w-[180px] max-w-md">
            <z-icon zType="search"
              class="absolute left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input type="text" [value]="searchTerm()" (input)="onSearch($any($event.target).value)"
              placeholder="Search notifications..."
              class="w-full pl-8 pr-2 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" />
          </div>

          <!-- Status Filter -->
          <div z-menu [zMenuTriggerFor]="statusMenu">
            <button z-button zType="outline" [class]="statusFilter()
                ? 'gap-2 border border-solid px-2 bg-primary/5 text-primary border-primary'
                : 'gap-2 border border-dashed px-2'">
              <z-icon [zType]="statusFilter() ? 'circle-check' : 'circle-plus'" class="w-4 h-4" />
              {{ statusFilter() === 'false' ? 'Unread' : statusFilter() === 'true' ? 'Read' : 'Status' }}
            </button>
          </div>
          <ng-template #statusMenu>
            <div z-menu-content class="w-48">
              <button type="button" z-menu-item (click)="statusFilter.set(''); loadNotifications()">
                All
              </button>
              <button type="button" z-menu-item (click)="statusFilter.set('false'); loadNotifications()">
                Unread
              </button>
              <button type="button" z-menu-item (click)="statusFilter.set('true'); loadNotifications()">
                Read
              </button>
            </div>
          </ng-template>

          <!-- Type Filter -->
          <div z-menu [zMenuTriggerFor]="typeMenu">
            <button z-button zType="outline" [class]="typeFilter()
                ? 'gap-2 border border-solid px-2 bg-primary/5 text-primary border-primary'
                : 'gap-2 border border-dashed px-2'">
              <z-icon [zType]="typeFilter() ? 'circle-check' : 'circle-plus'" class="w-4 h-4" />
              {{ typeFilter() ? getTypeLabel(typeFilter()) : 'Type' }}
            </button>
          </div>
          <ng-template #typeMenu>
            <div z-menu-content class="w-56">
              <button type="button" z-menu-item (click)="typeFilter.set(''); loadNotifications()">
                All Types
              </button>
              @for (t of notificationTypes; track t.value) {
                <button type="button" z-menu-item (click)="typeFilter.set(t.value); loadNotifications()">
                  {{ t.label }}
                </button>
              }
            </div>
          </ng-template>

          <!-- Clear Filters -->
          @if (statusFilter() || typeFilter() || searchTerm()) {
            <button type="button" z-button zType="outline" class="gap-2 border-none shadow-none px-2"
              (click)="clearFilters()">
              Reset
              <z-icon zType="x" class="w-4 h-4" />
            </button>
          }
        </div>
      </div>

      <!-- Notification List -->
      <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
        @if (notificationService.loading()) {
          @for (i of [1,2,3,4,5]; track i) {
            <div class="flex items-start gap-4 px-6 py-4 border-b border-border/50 last:border-b-0">
              <z-skeleton class="w-10 h-10 rounded-full" />
              <div class="flex-1 space-y-2">
                <z-skeleton class="h-4 w-48" />
                <z-skeleton class="h-3 w-72" />
                <z-skeleton class="h-3 w-24" />
              </div>
            </div>
          }
        } @else if (notificationService.notifications().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <z-icon zType="bell" zSize="xl" class="mb-3 opacity-30" />
            <p class="text-lg font-medium">No notifications</p>
            <p class="text-sm mt-1">You're all caught up!</p>
          </div>
        } @else {
          @for (notification of notificationService.notifications(); track notification.id) {
            <div class="flex items-start gap-4 px-5 py-4 border-b border-border/50 last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors relative"
              [class.bg-primary/5]="!notification.is_read"
              (click)="onNotificationClick(notification)">
              <!-- Unread accent bar -->
              @if (!notification.is_read) {
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>
              }
              <!-- Type Icon -->
              <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                [ngClass]="getNotificationIconBg(notification.type)">
                <z-icon [zType]="$any(getNotificationIcon(notification.type))" class="w-5 h-5 text-white" />
              </div>
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium" [class.font-semibold]="!notification.is_read">
                      {{ notification.title }}
                    </p>
                    <p class="text-sm text-muted-foreground mt-0.5">{{ notification.message }}</p>
                  </div>
                  <div class="flex items-center flex-shrink-0">
                    <z-badge zType="secondary" zShape="pill" class="text-[11px]">{{ getTypeLabel(notification.type) }}</z-badge>
                    <span class="text-xs text-muted-foreground whitespace-nowrap">{{ notification.created_at | timeAgo }}</span>
                  </div>
                </div>
              </div>
              <!-- Unread dot -->
              @if (!notification.is_read) {
                <span class="flex-shrink-0 w-2.5 h-2.5 bg-destructive rounded-full mt-2"></span>
              }
            </div>
          }
        }
      </div>

      <!-- Pagination -->
      @if (notificationService.pagination(); as pagination) {
        @if (pagination.totalPages > 1) {
          <div class="flex items-center justify-between mt-6">
            <p class="text-sm text-muted-foreground">
              Showing {{ (pagination.currentPage - 1) * pagination.limit + 1 }} to
              {{ Math.min(pagination.currentPage * pagination.limit, pagination.total) }} of {{ pagination.total }} notifications
            </p>
            <div class="flex items-center gap-2">
              <button z-button zType="outline" zSize="sm"
                [zDisabled]="pagination.currentPage <= 1"
                (click)="goToPage(pagination.currentPage - 1)">
                <z-icon zType="chevron-left" class="w-4 h-4" />
              </button>
              <span class="text-sm px-2">Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
              <button z-button zType="outline" zSize="sm"
                [zDisabled]="pagination.currentPage >= pagination.totalPages"
                (click)="goToPage(pagination.currentPage + 1)">
                <z-icon zType="chevron-right" class="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  notificationService = inject(NotificationService);
  private router = inject(Router);

  searchTerm = signal('');
  statusFilter = signal<string>('');
  typeFilter = signal<string>('');
  private searchTimeout: any = null;

  Math = Math;

  notificationTypes = [
    { value: 'leave_approved', label: 'Leave Approved' },
    { value: 'leave_rejected', label: 'Leave Rejected' },
    { value: 'claim_approved', label: 'Claim Approved' },
    { value: 'claim_rejected', label: 'Claim Rejected' },
    { value: 'claim_finance_approved', label: 'Finance Approved' },
    { value: 'claim_finance_rejected', label: 'Finance Rejected' },
    { value: 'wfh_approved', label: 'WFH Approved' },
    { value: 'wfh_rejected', label: 'WFH Rejected' },
    { value: 'announcement_published', label: 'Announcement' },
    { value: 'team_member_joined', label: 'Team Update' },
    { value: 'policy_published', label: 'Policy' }
  ];

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(page = 1): void {
    const filters: NotificationFilters = { page, limit: 15 };

    if (this.statusFilter()) {
      filters.is_read = this.statusFilter() === 'true';
    }
    if (this.typeFilter()) {
      filters.type = this.typeFilter() as NotificationType;
    }
    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    this.notificationService.loadNotifications(filters);
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadNotifications(), 400);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.typeFilter.set('');
    this.loadNotifications();
  }

  goToPage(page: number): void {
    this.loadNotifications(page);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id);
    }
    if (notification.data?.['link']) {
      this.router.navigate([notification.data['link']]);
    }
  }

  getNotificationIcon(type: NotificationType | string): string {
    const icons: Record<string, string> = {
      leave_approved: 'check-circle',
      leave_rejected: 'circle-x',
      claim_approved: 'check-circle',
      claim_rejected: 'circle-x',
      claim_finance_approved: 'check-circle',
      claim_finance_rejected: 'circle-x',
      wfh_approved: 'check-circle',
      wfh_rejected: 'circle-x',
      announcement_published: 'megaphone',
      team_member_joined: 'users',
      policy_published: 'file-text'
    };
    return icons[type] || 'bell';
  }

  getNotificationIconBg(type: NotificationType | string): string {
    const bgs: Record<string, string> = {
      leave_approved: 'bg-emerald-500',
      leave_rejected: 'bg-red-500',
      claim_approved: 'bg-emerald-500',
      claim_rejected: 'bg-red-500',
      claim_finance_approved: 'bg-emerald-500',
      claim_finance_rejected: 'bg-red-500',
      wfh_approved: 'bg-emerald-500',
      wfh_rejected: 'bg-red-500',
      announcement_published: 'bg-blue-500',
      team_member_joined: 'bg-purple-500',
      policy_published: 'bg-amber-500'
    };
    return bgs[type] || 'bg-gray-500';
  }

  getTypeLabel(type: NotificationType | string): string {
    const labels: Record<string, string> = {
      leave_approved: 'Leave',
      leave_rejected: 'Leave',
      claim_approved: 'Claim',
      claim_rejected: 'Claim',
      claim_finance_approved: 'Claim',
      claim_finance_rejected: 'Claim',
      wfh_approved: 'WFH',
      wfh_rejected: 'WFH',
      announcement_published: 'Announcement',
      team_member_joined: 'Team',
      policy_published: 'Policy'
    };
    return labels[type] || 'Notification';
  }
}
