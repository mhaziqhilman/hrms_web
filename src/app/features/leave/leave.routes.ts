import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const LEAVE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/leave-list/leave-list.component').then(
        (m) => m.LeaveListComponent
      ),
    data: { title: 'Leave Management' }
  },
  {
    path: 'apply',
    loadComponent: () =>
      import('./components/leave-form/leave-form.component').then(
        (m) => m.LeaveFormComponent
      ),
    data: { title: 'Apply Leave' }
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./components/leave-calendar/leave-calendar.component').then(
        (m) => m.LeaveCalendarComponent
      ),
    data: { title: 'Leave Calendar' }
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
      roles: ['admin', 'manager'] // Only accessible by admin and manager
    }
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/leave-form/leave-form.component').then(
        (m) => m.LeaveFormComponent
      ),
    data: { title: 'Edit Leave Application' }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/leave-details-component/leave-details-component').then(
        (m) => m.LeaveDetailsComponent
      ),
    data: { title: 'Leave Details' }
  }
];
