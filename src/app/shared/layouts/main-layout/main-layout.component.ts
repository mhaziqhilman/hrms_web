import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@/core/services/auth.service';
import { ThemeService } from '@/core/services/theme';
import { User } from '@/core/models/auth.models';
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
  sidebarCollapsed = signal(false);
  currentUser: User | null = null;

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
          title: 'Settings',
          icon: 'settings',
          route: '/settings'
        }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
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

  toggleTheme() {
    this.themeService.toggleTheme();
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
