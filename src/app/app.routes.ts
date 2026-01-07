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
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
