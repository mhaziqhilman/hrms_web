import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '@/core/services/auth.service';
import { CompanyService } from '@/core/services/company.service';
import { ThemeService } from '@/core/services/theme';
import { User, Company, UserCompany } from '@/core/models/auth.models';
import { SidebarMenuGroup } from '@/core/models/sidebar.models';

// ZardUI Component Imports
import { LayoutModule } from '@/shared/components/layout/layout.module';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardBreadcrumbModule } from '@/shared/components/breadcrumb/breadcrumb.module';

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
    ZardBreadcrumbModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  currentUser: User | null = null;
  currentCompany: Company | null = null;
  companyMemberships: UserCompany[] = [];
  allCompanies: Company[] = [];
  switchingCompany = false;
  isSuperAdmin = false;
  expandedMenuItems = new Set<string>();
  breadcrumbs = signal<{ label: string; url: string }[]>([]);

  // Sidebar collapse state driven by ThemeService
  get sidebarCollapsed() {
    return this.themeService.sidebarCollapsed;
  }

  menuGroups: SidebarMenuGroup[] = [
    {
      label: 'Dashboards',
      items: [
        {
          title: 'Admin Dashboard',
          icon: 'layout-dashboard',
          route: '/dashboard/admin',
          roles: ['super_admin', 'admin']
        },
        {
          title: 'Manager Dashboard',
          icon: 'users',
          route: '/dashboard/manager',
          roles: ['super_admin', 'admin', 'manager']
        },
        {
          title: 'Staff Dashboard',
          icon: 'circle-user',
          route: '/dashboard/staff'
        }
      ]
    },
    {
      label: 'HR Management',
      roles: ['super_admin', 'admin', 'manager'],
      items: [
        {
          title: 'Employees',
          icon: 'user',
          route: '/employees'
        },
        {
          title: 'Payroll',
          icon: 'dollar-sign',
          route: '/payroll'
        },
        {
          title: 'Leave',
          icon: 'calendar',
          route: '/leave'
        },
        {
          title: 'Attendance',
          icon: 'clock',
          children: [
            {
              title: 'Attendance List',
              icon: 'list',
              route: '/attendance'
            },
            {
              title: 'WFH',
              icon: 'house',
              route: '/attendance/wfh'
            }
          ]
        },
        {
          title: 'Claims',
          icon: 'file-text',
          route: '/claims'
        },
        {
          title: 'Statutory Reports',
          icon: 'file-chart-column',
          route: '/statutory-reports'
        },
        {
          title: 'Analytics',
          icon: 'bar-chart-3',
          route: '/analytics'
        }
      ]
    },
    {
      label: 'Personal',
      items: [
        {
          title: 'My Profile',
          icon: 'user-circle',
          route: '/personal/profile'
        },
        {
          title: 'My Leave',
          icon: 'calendar',
          route: '/leave',
          roles: ['staff']
        },
        {
          title: 'My Attendance',
          icon: 'clock',
          route: '/attendance',
          roles: ['staff']
        },
        {
          title: 'My Claims',
          icon: 'file-text',
          route: '/claims',
          roles: ['staff']
        }
      ]
    },
    {
      label: 'Administration',
      roles: ['super_admin', 'admin'],
      items: [
        {
          title: 'Admin Settings',
          icon: 'settings',
          roles: ['super_admin', 'admin'],
          children: [
            {
              title: 'Company Profile',
              icon: 'building',
              route: '/admin-settings/company'
            },
            {
              title: 'Leave Types',
              icon: 'calendar',
              route: '/admin-settings/leave-types'
            },
            {
              title: 'Leave Entitlements',
              icon: 'calendar-check',
              route: '/admin-settings/leave-entitlements'
            },
            {
              title: 'Claim Types',
              icon: 'file-text',
              route: '/admin-settings/claim-types'
            },
            {
              title: 'Public Holidays',
              icon: 'calendar',
              route: '/admin-settings/holidays'
            },
            {
              title: 'Payroll Config',
              icon: 'circle-dollar-sign',
              route: '/admin-settings/payroll-config'
            },
            {
              title: 'Email Templates',
              icon: 'mail',
              route: '/admin-settings/email-templates'
            }
          ]
        }
      ]
    },
    {
      label: 'Systems',
      items: [
        {
          title: 'User Management',
          icon: 'shield',
          route: '/user-management',
          roles: ['super_admin', 'admin']
        },
        {
          title: 'Settings',
          icon: 'settings',
          children: [
            {
              title: 'Account',
              icon: 'circle-user',
              route: '/settings/account'
            },
            {
              title: 'Appearance',
              icon: 'sun-moon',
              route: '/settings/appearance'
            },
            {
              title: 'Notifications',
              icon: 'bell',
              route: '/settings/notifications'
            },
            {
              title: 'Display',
              icon: 'monitor',
              route: '/settings/display'
            }
          ]
        }
      ]
    }
  ];

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
              this.currentCompany = { ...this.currentCompany!, ...res.data };
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

    // Refresh user data from API to ensure localStorage is up-to-date
    this.authService.getCurrentUser().subscribe();
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
        const label = this.findLabelByUrl(url) || this.formatLabel(routeURL);
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
}
