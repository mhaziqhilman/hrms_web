import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/attendance-list/attendance-list.component').then(
        (m) => m.AttendanceListComponent
      ),
    data: { title: 'Attendance Records' }
  },
  {
    path: 'clock',
    loadComponent: () =>
      import('./components/clock-in-out/clock-in-out.component').then(
        (m) => m.ClockInOutComponent
      ),
    data: { title: 'Clock In/Out' }
  },
  {
    path: 'wfh',
    loadComponent: () =>
      import('./components/wfh-application/wfh-application.component').then(
        (m) => m.WfhApplicationComponent
      ),
    data: { title: 'WFH Application' }
  },
  {
    path: 'my',
    loadComponent: () =>
      import('./components/my-attendance/my-attendance.component').then(
        (m) => m.MyAttendanceComponent
      ),
    data: { title: 'My Attendance' }
  },
  {
    path: 'wfh/approvals',
    loadComponent: () =>
      import('./components/wfh-approval-list/wfh-approval-list').then(
        (m) => m.WfhApprovalListComponent
      ),
    data: { title: 'WFH Approvals' }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/attendance-detail/attendance-detail.component').then(
        (m) => m.AttendanceDetailComponent
      ),
    data: { title: 'Attendance Details' }
  }
];
