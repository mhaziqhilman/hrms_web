import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const LEAVE_ROUTES: Routes = [
  {
    path: 'apply',
    loadComponent: () =>
      import('./components/leave-form/leave-form.component').then(
        (m) => m.LeaveFormComponent
      ),
    data: { title: 'Apply Leave', layout: 'reading' }
  },
  {
    path: 'balance',
    loadComponent: () =>
      import('./components/leave-balance/leave-balance.component').then(
        (m) => m.LeaveBalanceComponent
      ),
    data: { title: 'Leave Balance' }
  },
  {
    path: 'approvals',
    canActivate: [roleGuard(['super_admin', 'admin', 'manager'])],
    loadComponent: () =>
      import('./components/leave-approval/leave-approval.component').then(
        (m) => m.LeaveApprovalComponent
      ),
    data: {
      title: 'Leave Approvals',
      roles: ['admin', 'manager']
    }
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/leave-page/leave-page.component').then(
        (m) => m.LeavePageComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/leave-dashboard/leave-dashboard.component').then(
            (m) => m.LeaveDashboardComponent
          ),
        data: {
          title: 'Leave Dashboard',
          subtitle:
            'Track entitlements, usage and pending approvals across all leave types'
        }
      },
      {
        path: 'list',
        loadComponent: () =>
          import('./components/leave-list/leave-list.component').then(
            (m) => m.LeaveListComponent
          ),
        data: {
          title: 'Leave Management',
          subtitle: 'View and track all leave applications'
        }
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./components/leave-calendar/leave-calendar.component').then(
            (m) => m.LeaveCalendarComponent
          ),
        data: {
          title: 'Leave Calendar',
          subtitle: 'Track team leave status at a glance'
        }
      }
    ]
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/leave-form/leave-form.component').then(
        (m) => m.LeaveFormComponent
      ),
    data: { title: 'Edit Leave Application', layout: 'reading' }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/leave-details-component/leave-details-component').then(
        (m) => m.LeaveDetailsComponent
      ),
    data: { title: 'Leave Details', layout: 'reading' }
  }
];
