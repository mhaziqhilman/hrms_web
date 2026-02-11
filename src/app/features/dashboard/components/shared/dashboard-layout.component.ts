import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CompanyService } from '../../../../core/services/company.service';
import { User, Company } from '../../../../core/models/auth.models';
import { SidebarMenuGroup, SidebarMenuItem } from '../../../../core/models/sidebar.models';

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
  selector: 'app-dashboard-layout',
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
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {
  sidebarCollapsed = signal(false);
  currentUser: User | null = null;

  // Company context for super_admin
  allCompanies = signal<Company[]>([]);
  viewingCompany = signal<Company | null>(null);
  isSuperAdmin = signal(false);

  menuGroups: SidebarMenuGroup[] = [
    {
      label: 'Dashboards',
      items: [
        {
          title: 'Admin Dashboard',
          icon: 'layout-dashboard',
          route: '/dashboard/admin'
        },
        {
          title: 'Manager Dashboard',
          icon: 'users',
          route: '/dashboard/manager'
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
          route: '/attendance'
        },
        {
          title: 'Claims',
          icon: 'file-text',
          route: '/claims'
        }
      ]
    },
    {
      label: 'System',
      items: [
        {
          title: 'User Management',
          icon: 'users-round' as any,
          route: '/user-management',
          roles: ['super_admin', 'admin']
        },
        {
          title: 'Settings',
          icon: 'settings',
          route: '/settings'
        }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      const superAdmin = user?.role === 'super_admin';
      this.isSuperAdmin.set(superAdmin);

      if (superAdmin) {
        this.loadCompanies();
        // Set viewing company from current user's company context
        if (user?.company) {
          this.viewingCompany.set(user.company);
        } else {
          this.viewingCompany.set(null);
        }
      }
    });
  }

  /**
   * Filter menu items by current user role
   */
  getFilteredItems(items: SidebarMenuItem[]): SidebarMenuItem[] {
    if (!this.currentUser) return items;
    return items.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(this.currentUser!.role);
    });
  }

  loadCompanies(): void {
    this.companyService.getAllCompanies().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allCompanies.set(res.data);
        }
      }
    });
  }

  switchToCompany(company: Company): void {
    this.companyService.switchCompany(company.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.authService.updateSession(res.data.token, res.data.user);
          this.viewingCompany.set(company);
        }
      }
    });
  }

  clearCompanyContext(): void {
    this.companyService.clearCompanyContext().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.authService.updateSession(res.data.token, res.data.user);
          this.viewingCompany.set(null);
        }
      }
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(value => !value);
  }

  onSidebarCollapsedChange(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }

  getUserInitials(): string {
    if (!this.currentUser?.employee?.full_name) {
      return 'U';
    }

    const names = this.currentUser.employee.full_name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }

    return this.currentUser.employee.full_name.substring(0, 2).toUpperCase();
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
