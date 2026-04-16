import { Routes } from '@angular/router';
import { authGuard } from '@/core/guards/auth.guard';
import { MobileShellComponent } from '@/mobile/layouts/mobile-shell/mobile-shell.component';

export const MOBILE_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/mobile-login/mobile-login.component').then((m) => m.MobileLoginComponent),
    data: { title: 'Sign in' },
  },
  {
    path: '',
    component: MobileShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/mobile-home/mobile-home.component').then((m) => m.MobileHomeComponent),
        data: { title: 'Home' },
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./pages/mobile-attendance/mobile-attendance.component').then(
            (m) => m.MobileAttendanceComponent,
          ),
        data: { title: 'Attendance' },
      },
      {
        path: 'leave',
        loadComponent: () =>
          import('./pages/mobile-leave/mobile-leave.component').then((m) => m.MobileLeaveComponent),
        data: { title: 'Leave' },
      },
      {
        path: 'leave/apply',
        loadComponent: () =>
          import('./pages/mobile-leave-apply/mobile-leave-apply.component').then(
            (m) => m.MobileLeaveApplyComponent,
          ),
        data: { title: 'Apply Leave' },
      },
      {
        path: 'leave/calendar',
        loadComponent: () =>
          import('./pages/mobile-leave-calendar/mobile-leave-calendar.component').then(
            (m) => m.MobileLeaveCalendarComponent,
          ),
        data: { title: 'Leave Calendar' },
      },
      {
        path: 'claims',
        loadComponent: () =>
          import('./pages/mobile-claims/mobile-claims.component').then(
            (m) => m.MobileClaimsComponent,
          ),
        data: { title: 'Claims' },
      },
      {
        path: 'claims/submit',
        loadComponent: () =>
          import('./pages/mobile-claim-submit/mobile-claim-submit.component').then(
            (m) => m.MobileClaimSubmitComponent,
          ),
        data: { title: 'New Claim' },
      },
      {
        path: 'announcements',
        loadComponent: () =>
          import('./pages/mobile-announcements/mobile-announcements.component').then(
            (m) => m.MobileAnnouncementsComponent,
          ),
        data: { title: 'Announcements' },
      },
      {
        path: 'announcements/:id',
        loadComponent: () =>
          import('./pages/mobile-announcement-detail/mobile-announcement-detail.component').then(
            (m) => m.MobileAnnouncementDetailComponent,
          ),
        data: { title: 'Announcement' },
      },
      {
        path: 'directory',
        loadComponent: () =>
          import('./pages/mobile-directory/mobile-directory.component').then(
            (m) => m.MobileDirectoryComponent,
          ),
        data: { title: 'Directory' },
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./pages/mobile-documents/mobile-documents.component').then(
            (m) => m.MobileDocumentsComponent,
          ),
        data: { title: 'Documents' },
      },
      {
        path: 'wfh',
        loadComponent: () =>
          import('./pages/mobile-wfh/mobile-wfh.component').then((m) => m.MobileWfhComponent),
        data: { title: 'Work From Home' },
      },
      {
        path: 'payslip',
        loadComponent: () =>
          import('./pages/mobile-payslip/mobile-payslip.component').then(
            (m) => m.MobilePayslipComponent,
          ),
        data: { title: 'Payslips' },
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/mobile-notifications/mobile-notifications.component').then(
            (m) => m.MobileNotificationsComponent,
          ),
        data: { title: 'Notifications' },
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/mobile-profile/mobile-profile.component').then(
            (m) => m.MobileProfileComponent,
          ),
        data: { title: 'Profile' },
      },
      {
        path: 'approvals',
        loadComponent: () =>
          import('./pages/mobile-approvals/mobile-approvals.component').then(
            (m) => m.MobileApprovalsComponent,
          ),
        data: { title: 'Approvals' },
      },
      {
        path: 'more',
        loadComponent: () =>
          import('./pages/mobile-more/mobile-more.component').then((m) => m.MobileMoreComponent),
        data: { title: 'More' },
      },
    ],
  },
];
