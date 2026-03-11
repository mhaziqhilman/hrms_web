import { Component, OnInit, signal, ChangeDetectorRef, inject, ViewChild, ViewContainerRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '@/core/services/auth.service';
import { CompanyService } from '@/core/services/company.service';
import { ThemeService } from '@/core/services/theme';
import { UserProfileService } from '@/core/services/user-profile.service';
import { DisplayService } from '@/core/services/display.service';
import { User, Company, UserCompany } from '@/core/models/auth.models';
import { SidebarMenuGroup } from '@/core/models/sidebar.models';
import { MENU_GROUPS } from '@/core/config/menu.config';
import { CommandPaletteService } from '@/shared/components/command-palette/command-palette.service';
import { NotificationService } from '@/core/services/notification.service';
import { Notification as AppNotification, NotificationType } from '@/core/models/notification.models';
import { SettingsService } from '@/features/settings/services/settings.service';
import { TimeAgoPipe } from '@/shared/pipes/time-ago.pipe';

// ZardUI Component Imports
import { LayoutModule } from '@/shared/components/layout/layout.module';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardMenuDirective } from '@/shared/components/menu/menu.directive';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardBreadcrumbModule } from '@/shared/components/breadcrumb/breadcrumb.module';
import { FeedbackWidgetComponent } from '@/shared/components/feedback-widget/feedback-widget.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LayoutModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardMenuImports,
    ZardTooltipModule,
    ZardAvatarComponent,
    ZardDividerComponent,
    ZardBreadcrumbModule,
    TimeAgoPipe,
    FeedbackWidgetComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private commandPaletteService = inject(CommandPaletteService);
  private viewContainerRef = inject(ViewContainerRef);
  userProfileService = inject(UserProfileService);
  notificationService = inject(NotificationService);
  private displayService = inject(DisplayService);
  private settingsService = inject(SettingsService);

  notificationMenuOpen = false;
  currentUser: User | null = null;
  currentCompany: Company | null = null;
  companyMemberships: UserCompany[] = [];
  allCompanies: Company[] = [];
  switchingCompany = false;
  isSuperAdmin = false;
  companyMenuOpen = false;
  expandedMenuItems = new Set<string>();

  @ViewChild('companyMenuTrigger') companyMenuTriggerRef?: ZardMenuDirective;

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.companyMenuOpen) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-company-trigger]') || target.closest('.cdk-overlay-pane')) return;
    this.companyMenuTriggerRef?.close();
  }
  breadcrumbs = signal<{ label: string; url: string }[]>([]);

  // Sidebar collapse state driven by ThemeService
  get sidebarCollapsed() {
    return this.themeService.sidebarCollapsed;
  }

  menuGroups: SidebarMenuGroup[] = MENU_GROUPS;

  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    public themeService: ThemeService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs.set(this.createBreadcrumbs(this.activatedRoute.root));
      });

    // Initialize breadcrumbs immediately
    this.breadcrumbs.set(this.createBreadcrumbs(this.activatedRoute.root));
  }

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isSuperAdmin = user?.role === 'super_admin';

      // Set currentCompany from user's company association
      this.currentCompany = user?.company ?? null;

      // Fetch company details with resolved logo signed URL
      if (this.currentCompany) {
        this.companyService.getMyCompany().subscribe({
          next: (res) => {
            if (res.success && res.data) {
              // Defer to next CD cycle to avoid ExpressionChangedAfterItHasBeenCheckedError
              setTimeout(() => {
                this.currentCompany = { ...this.currentCompany!, ...res.data };
                this.cdr.markForCheck();
              });
            }
          }
        });
      }

      // Load company list for the switcher
      if (this.isSuperAdmin || user?.company_id) {
        this.loadCompanyMemberships();
      } else {
        this.companyMemberships = [];
        this.allCompanies = [];
      }
    });

    // Load profile picture
    this.userProfileService.loadProfile();

    // Refresh user data from API to ensure localStorage is up-to-date
    this.authService.getCurrentUser().subscribe();

    // Load display settings for date/time formatting across the app
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        if (res.success) {
          this.displayService.update({
            date_format: res.data.date_format,
            time_format: res.data.time_format,
            timezone: res.data.timezone,
            language: res.data.language
          });
        }
      }
    });
  }

  private loadCompanyMemberships(): void {
    // For super_admin: fetch ALL companies; for others: fetch memberships
    if (this.isSuperAdmin) {
      this.companyService.getAllCompanies().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.allCompanies = res.data;
          }
        }
      });
    } else {
      this.companyService.getMyCompanies().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.companyMemberships = res.data;
          }
        }
      });
    }
  }

  toggleSidebar() {
    this.themeService.setSidebarCollapsed(!this.sidebarCollapsed());
  }

  onSidebarCollapsedChange(collapsed: boolean) {
    this.themeService.setSidebarCollapsed(collapsed);
  }

  getUserInitials(): string {
    if (!this.currentUser?.employee?.full_name) {
      return 'U';
    }

    const names = this.currentUser.employee.full_name.split(' ').filter(Boolean);
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }

    return names[0].substring(0, 2).toUpperCase();
  }

  getDisplayName(): string {
    if (!this.currentUser?.employee?.full_name) {
      return 'User';
    }

    return this.currentUser.employee.full_name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  getDisplayRole(): string {
    const role = this.currentUser?.role;
    if (!role) return 'User';
    return role.replace(/_/g, ' ');
  }

  getCompanyInitials(name?: string): string {
    const companyName = name || this.currentCompany?.name;
    if (!companyName) return 'CO';
    const words = companyName.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  }

  switchCompany(companyId: number): void {
    if (companyId === this.currentCompany?.id || this.switchingCompany) return;
    this.switchingCompany = true;

    this.companyService.switchCompany(companyId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.authService.updateSession(res.data.token, res.data.user);
          // Reload the page to refresh all data for the new company context
          window.location.href = '/dashboard';
        }
        this.switchingCompany = false;
      },
      error: () => {
        this.switchingCompany = false;
      }
    });
  }

  clearCompanyContext(): void {
    if (!this.currentCompany || this.switchingCompany) return;
    this.switchingCompany = true;

    this.companyService.clearCompanyContext().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.authService.updateSession(res.data.token, res.data.user);
          this.currentCompany = null;
          window.location.href = '/dashboard';
        }
        this.switchingCompany = false;
      },
      error: () => {
        this.switchingCompany = false;
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.openCommandPalette();
    }
  }

  openCommandPalette(): void {
    this.commandPaletteService.open(this.viewContainerRef);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleMenuItem(title: string) {
    if (this.expandedMenuItems.has(title)) {
      this.expandedMenuItems.delete(title);
    } else {
      this.expandedMenuItems.add(title);
    }
  }

  isMenuItemExpanded(title: string): boolean {
    return this.expandedMenuItems.has(title);
  }

  getDisplayTitle(title: string): string {
    if (this.currentUser?.role === 'staff' && title.startsWith('My ')) {
      return title.substring(3);
    }
    return title;
  }

  isGroupVisible(group: SidebarMenuGroup): boolean {
    if (!group.roles || group.roles.length === 0) return true;
    return !!this.currentUser && group.roles.includes(this.currentUser.role);
  }

  isItemVisible(item: { roles?: string[] }): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return !!this.currentUser && item.roles.includes(this.currentUser.role);
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: { label: string; url: string }[] = []
  ): { label: string; url: string }[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      if (!child.snapshot || !child.snapshot.url) {
        continue;
      }
      const routeURL: string = child.snapshot.url
        .map((segment) => segment.path)
        .join('/');

      if (routeURL !== '') {
        url += `/${routeURL}`;
        const menuLabel = this.findLabelByUrl(url);
        const routeTitle = child.snapshot.data['title'] as string | undefined;
        const label = menuLabel || (this.isUuid(routeURL) && routeTitle ? routeTitle : this.formatLabel(routeURL));
        breadcrumbs.push({ label, url });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private findLabelByUrl(url: string): string | null {
    // Helper to find label in menuGroups
    for (const group of this.menuGroups) {
      for (const item of group.items) {
        if (item.route === url) return item.title;
        if (item.children) {
          for (const child of item.children) {
            if (child.route === url) return child.title;
          }
        }
      }
    }
    return null;
  }

  private isUuid(text: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  }

  private formatLabel(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logged out successfully');
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  // Notification helpers
  onNotificationMenuOpen(): void {
    this.notificationMenuOpen = true;
    this.notificationService.loadRecentNotifications();
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id);
    }
    if (notification.data?.['link']) {
      this.router.navigate([notification.data['link']]);
    }
  }

  markAllNotificationsRead(): void {
    this.notificationService.markAllAsRead();
  }

  getNotificationIcon(type: NotificationType): string {
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

  getNotificationIconBg(type: NotificationType): string {
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
}
