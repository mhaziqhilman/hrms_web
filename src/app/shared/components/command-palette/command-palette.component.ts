import { Component, inject, OnInit, viewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ZardCommandComponent,
  ZardCommandInputComponent,
  ZardCommandListComponent,
  ZardCommandOptionGroupComponent,
  ZardCommandOptionComponent,
  ZardCommandEmptyComponent,
} from '@/shared/components/command/command.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { AuthService } from '@/core/services/auth.service';
import { ThemeService } from '@/core/services/theme';
import { CompanyService } from '@/core/services/company.service';
import { getMenuGroupsForRole } from '@/core/config/menu.config';
import { SidebarMenuGroup, SidebarMenuItem } from '@/core/models/sidebar.models';
import { CommandPaletteService } from './command-palette.service';

interface CommandItem {
  label: string;
  icon: string;
  value: string;
  route?: string;
  action?: () => void;
  keywords: string[];
  roles?: string[];
}

interface CommandGroup {
  label: string;
  items: CommandItem[];
  showOnDefault: boolean;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [
    ZardCommandComponent,
    ZardCommandInputComponent,
    ZardCommandListComponent,
    ZardCommandOptionGroupComponent,
    ZardCommandOptionComponent,
    ZardCommandEmptyComponent,
    ZardIconComponent,
  ],
  template: `
    <z-command (zCommandSelected)="onSelect($event)">
      <z-command-input placeholder="Type a command or search..." />
      <z-command-list>
        <z-command-empty>No results found.</z-command-empty>

        @for (group of commandGroups; track group.label) {
          <z-command-option-group [zLabel]="group.label">
            @for (item of group.items; track item.value) {
              <z-command-option
                [zValue]="item.value"
                [zLabel]="item.label"
                [zKeywords]="item.keywords"
              >
                <z-icon [zType]="$any(item.icon)" zSize="sm" class="mr-2 text-muted-foreground" />
                <span>{{ item.label }}</span>
              </z-command-option>
            }
          </z-command-option-group>
        }
      </z-command-list>
    </z-command>
  `,
})
export class CommandPaletteComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private companyService = inject(CompanyService);
  private commandPaletteService = inject(CommandPaletteService);

  private commandInput = viewChild(ZardCommandInputComponent);

  commandGroups: CommandGroup[] = [];

  ngOnInit(): void {
    this.buildCommandGroups();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.commandInput()?.focus());
  }

  onSelect(event: { value: string; label: string }): void {
    const item = this.findItem(event.value);
    if (!item) return;

    this.commandPaletteService.close();

    if (item.action) {
      item.action();
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  private findItem(value: string): CommandItem | undefined {
    for (const group of this.commandGroups) {
      const found = group.items.find(i => i.value === value);
      if (found) return found;
    }
    return undefined;
  }

  private buildCommandGroups(): void {
    const userRole = this.authService.getCurrentUserValue()?.role;
    if (!userRole) return;

    const isVisible = (roles?: string[]) => !roles || roles.length === 0 || roles.includes(userRole);

    // --- Suggestions (curated top pages, shown by default) ---
    const suggestions: CommandItem[] = [];
    const suggestionRoutes = this.getSuggestionRoutes(userRole);

    const menuGroups = getMenuGroupsForRole(userRole);
    for (const group of menuGroups) {
      if (!isVisible(group.roles)) continue;
      this.flattenItems(group.items, group.roles).forEach(item => {
        if (isVisible(item.roles) && item.route && suggestionRoutes.includes(item.route)) {
          suggestions.push(item);
        }
      });
    }

    if (suggestions.length > 0) {
      this.commandGroups.push({ label: 'Suggestions', items: suggestions, showOnDefault: true });
    }

    // --- Quick Actions (shown by default) ---
    const quickActions: CommandItem[] = [
      {
        label: this.themeService.darkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        icon: this.themeService.darkMode() ? 'sun' : 'moon',
        value: 'action:toggle-theme',
        keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
        action: () => this.themeService.toggleTheme(),
      },
      {
        label: 'Logout',
        icon: 'log-out',
        value: 'action:logout',
        keywords: ['sign out', 'exit', 'logout'],
        action: () => this.authService.logout().subscribe(),
      },
    ];

    // Add switch company only if user has multiple companies
    if (this.hasMultipleCompanies(userRole)) {
      quickActions.splice(1, 0, {
        label: 'Switch Company',
        icon: 'building',
        value: 'action:switch-company',
        keywords: ['company', 'organization', 'switch', 'change'],
        route: '/onboarding/choice',
      });
    }

    this.commandGroups.push({ label: 'Quick Actions', items: quickActions, showOnDefault: true });

    // --- Navigation groups (shown when searching) ---
    for (const group of menuGroups) {
      if (!isVisible(group.roles)) continue;

      const items = this.flattenItems(group.items, group.roles)
        .filter(item => isVisible(item.roles) && item.route);

      // Skip if all items are already in suggestions
      const nonSuggestionItems = items.filter(i => !suggestionRoutes.includes(i.route!));
      if (nonSuggestionItems.length > 0) {
        this.commandGroups.push({ label: group.label, items, showOnDefault: false });
      }
    }
  }

  private flattenItems(items: SidebarMenuItem[], parentRoles?: string[]): CommandItem[] {
    const result: CommandItem[] = [];

    for (const item of items) {
      const effectiveRoles = item.roles || parentRoles;

      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          result.push({
            label: child.title,
            icon: child.icon as string,
            value: `nav:${child.route}`,
            route: child.route,
            keywords: this.getKeywords(child.title, item.title),
            roles: child.roles || effectiveRoles,
          });
        }
      } else if (item.route) {
        result.push({
          label: item.title,
          icon: item.icon as string,
          value: `nav:${item.route}`,
          route: item.route,
          keywords: this.getKeywords(item.title),
          roles: effectiveRoles,
        });
      }
    }

    return result;
  }

  private getSuggestionRoutes(role: string): string[] {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return ['/dashboard/admin', '/employees', '/leave', '/personal/profile', '/attendance'];
      case 'manager':
        return ['/dashboard/manager', '/employees', '/leave', '/personal/profile', '/attendance'];
      case 'staff':
        return ['/dashboard/staff', '/personal/profile', '/leave', '/attendance/my', '/claims'];
      default:
        return ['/dashboard/staff', '/personal/profile'];
    }
  }

  private getKeywords(title: string, parentTitle?: string): string[] {
    const keywords: string[] = [];
    if (parentTitle) keywords.push(parentTitle.toLowerCase());

    const keywordMap: Record<string, string[]> = {
      'Employees': ['staff', 'people', 'team', 'workers', 'hr'],
      'Leave': ['time off', 'vacation', 'annual', 'sick', 'holiday'],
      'My Leave': ['time off', 'vacation', 'annual', 'sick', 'apply leave'],
      'Attendance': ['clock in', 'clock out', 'time', 'check in'],
      'Attendance List': ['clock in', 'clock out', 'time', 'check in'],
      'My Attendance': ['clock in', 'clock out', 'time', 'check in'],
      'WFH': ['work from home', 'remote', 'wfh application'],
      'Claims': ['expense', 'reimbursement', 'receipt', 'claim'],
      'My Claims': ['expense', 'reimbursement', 'receipt', 'submit claim'],
      'Payroll': ['salary', 'wages', 'pay', 'compensation'],
      'Documents': ['files', 'upload', 'document', 'attachment'],
      'Analytics': ['reports', 'statistics', 'charts', 'data', 'insights'],
      'User Management': ['users', 'roles', 'permissions', 'access'],
      'Company Profile': ['company info', 'organization', 'business details'],
      'Leave Types': ['leave categories', 'annual leave', 'sick leave'],
      'Leave Entitlements': ['leave balance', 'entitlement', 'allocation'],
      'Claim Types': ['claim categories', 'expense types'],
      'Public Holidays': ['holidays', 'off days', 'calendar'],
      'Payroll Config': ['payroll settings', 'salary config', 'epf', 'socso'],
      'Email Templates': ['email', 'notification templates', 'mail'],
      'My Profile': ['profile', 'personal info', 'account', 'details'],
      'Admin Dashboard': ['overview', 'summary', 'statistics', 'admin'],
      'Manager Dashboard': ['overview', 'summary', 'team'],
      'Staff Dashboard': ['overview', 'my summary', 'personal'],
      'Statutory Reports': ['statutory', 'government', 'compliance', 'epf', 'socso', 'eis'],
      'Announcements': ['communication', 'news', 'broadcast', 'notice'],
    };

    if (keywordMap[title]) {
      keywords.push(...keywordMap[title]);
    }

    return keywords;
  }

  private hasMultipleCompanies(role: string): boolean {
    // Super admins can always switch; for others, we optimistically show it
    return role === 'super_admin';
  }
}
