import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./features/landing/landing-module').then(m => m.LandingModule)
    },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
            },
            {
                path: 'employees',
                loadChildren: () => import('./features/employees/employees.routes').then(m => m.EMPLOYEES_ROUTES)
            },
            {
                path: 'payroll',
                loadChildren: () => import('./features/payroll/payroll.routes').then(m => m.PAYROLL_ROUTES)
            },
            {
                path: 'leave',
                loadChildren: () => import('./features/leave/leave.routes').then(m => m.LEAVE_ROUTES)
            },
            {
                path: 'attendance',
                loadChildren: () => import('./features/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
            },
            {
                path: 'claims',
                loadChildren: () => import('./features/claims/claims.routes').then(m => m.CLAIMS_ROUTES)
            },
            {
                path: 'communication',
                loadChildren: () => import('./features/communication/communication.routes').then(m => m.COMMUNICATION_ROUTES)
            },
            {
                path: 'statutory-reports',
                loadChildren: () => import('./features/statutory-reports/statutory-reports.routes').then(m => m.STATUTORY_REPORTS_ROUTES)
            },
            {
                path: 'analytics',
                loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.analyticsRoutes)
            },
            {
                path: 'personal',
                loadChildren: () => import('./features/personal/personal.routes').then(m => m.personalRoutes)
            },
            {
                path: 'user-management',
                loadChildren: () => import('./features/user-management/user-management.routes').then(m => m.USER_MANAGEMENT_ROUTES)
            },
            {
                path: 'settings',
                loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES)
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
