import { SidebarMenuGroup } from '@/core/models/sidebar.models';

/**
 * Admin / Super Admin menu layout
 */
const ADMIN_MENU: SidebarMenuGroup[] = [
  {
    label: 'Personal',
    items: [
      {
        title: 'My Dashboard',
        icon: 'layout-dashboard',
        route: '/dashboard'
      },
      {
        title: 'Profile',
        icon: 'user-circle',
        route: '/personal/profile'
      },
      {
        title: 'Notifications',
        icon: 'bell',
        route: '/notifications'
      },
      {
        title: 'Announcements',
        icon: 'megaphone',
        route: '/communication'
      }
    ]
  },
  {
    label: 'HR Management',
    roles: ['super_admin', 'admin'],
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
      },
      {
        title: 'Documents',
        icon: 'folder-open',
        route: '/documents',
        roles: ['super_admin', 'admin']
      },
      {
        title: 'Statutory Reports',
        icon: 'file-chart-column',
        route: '/statutory-reports'
      },
      {
        title: 'e-Invoices',
        icon: 'file-spreadsheet',
        route: '/e-invoices',
        roles: ['super_admin', 'admin']
      },
      {
        title: 'Analytics',
        icon: 'bar-chart-3',
        route: '/analytics'
      }
    ]
  },
  {
    label: 'Administration',
    roles: ['super_admin', 'admin'],
    items: [
      {
        title: 'Feedback',
        icon: 'message-square',
        route: '/feedback',
        roles: ['super_admin']
      },
      {
        title: 'Audit Log',
        icon: 'shield-check',
        route: '/audit-log',
        roles: ['super_admin']
      },
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
            title: 'Statutory Info',
            icon: 'landmark',
            route: '/admin-settings/statutory-info'
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

/**
 * Manager menu layout — approvals only, no HR admin features.
 * Team viewing is via "My Team" tab on Profile page.
 */
const MANAGER_MENU: SidebarMenuGroup[] = [
  {
    label: 'Personal',
    items: [
      {
        title: 'My Dashboard',
        icon: 'layout-dashboard',
        route: '/dashboard'
      },
      {
        title: 'Profile',
        icon: 'user-circle',
        route: '/personal/profile'
      },
      {
        title: 'Notifications',
        icon: 'bell',
        route: '/notifications'
      },
      {
        title: 'Announcements',
        icon: 'megaphone',
        route: '/communication'
      }
    ]
  },
  {
    label: 'Team Oversight',
    items: [
      {
        title: 'Leave',
        icon: 'calendar',
        route: '/leave'
      },
      {
        title: 'Claim Approvals',
        icon: 'file-text',
        route: '/claims'
      },
      {
        title: 'Attendance',
        icon: 'clock',
        route: '/attendance'
      }
    ]
  },
  {
    label: 'Systems',
    items: [
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

/**
 * Staff menu layout — personal-focused, no management features.
 */
const STAFF_MENU: SidebarMenuGroup[] = [
  {
    label: 'Personal',
    items: [
      {
        title: 'My Dashboard',
        icon: 'layout-dashboard',
        route: '/dashboard'
      },
      {
        title: 'Profile',
        icon: 'user-circle',
        route: '/personal/profile'
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
      },
      {
        title: 'Notifications',
        icon: 'bell',
        route: '/notifications'
      },
      {
        title: 'Announcements',
        icon: 'megaphone',
        route: '/communication'
      }
    ]
  },
  {
    label: 'Systems',
    items: [
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

/**
 * Returns the menu groups for a given user role.
 */
export function getMenuGroupsForRole(role: string): SidebarMenuGroup[] {
  switch (role) {
    case 'manager':
      return MANAGER_MENU;
    case 'staff':
      return STAFF_MENU;
    default:
      return ADMIN_MENU;
  }
}

/** @deprecated Use getMenuGroupsForRole() instead */
export const MENU_GROUPS: SidebarMenuGroup[] = ADMIN_MENU;
