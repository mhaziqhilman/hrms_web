import { SidebarMenuGroup } from '@/core/models/sidebar.models';

export const MENU_GROUPS: SidebarMenuGroup[] = [
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
        roles: ['super_admin', 'manager']
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
        route: '/attendance/my',
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
        title: 'Feedback',
        icon: 'message-square',
        route: '/feedback',
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
