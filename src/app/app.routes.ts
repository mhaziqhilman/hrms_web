import { Routes } from '@angular/router';
import { authGuard, onboardingGuard } from './core/guards/auth.guard';
import { packageFeatureGuard } from './core/guards/package-feature.guard';
import { appZoneGuard } from './core/guards/zone.guard';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';

export const routes: Routes = [
    {
        // Marketing landing now lives in the Nextura Hub (nextura.my).
        // The HR app's root goes straight to the app (authGuard → login if signed out).
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'auth',
        canActivate: [appZoneGuard],
        loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
    },
    {
        path: 'm',
        loadChildren: () => import('./mobile/mobile.routes').then(m => m.MOBILE_ROUTES)
    },
    {
        path: 'onboarding',
        canActivate: [appZoneGuard, onboardingGuard],
        loadChildren: () => import('./features/onboarding/onboarding.routes').then(m => m.ONBOARDING_ROUTES)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [appZoneGuard, authGuard],
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
                canActivate: [packageFeatureGuard('payroll')],
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
                canActivate: [packageFeatureGuard('claims')],
                loadChildren: () => import('./features/claims/claims.routes').then(m => m.CLAIMS_ROUTES)
            },
            {
                path: 'overtime',
                loadChildren: () => import('./features/overtime/overtime.routes').then(m => m.OVERTIME_ROUTES)
            },
            {
                path: 'documents',
                canActivate: [packageFeatureGuard('document_management')],
                loadChildren: () => import('./features/documents/documents.routes').then(m => m.DOCUMENTS_ROUTES)
            },
            {
                path: 'communication',
                loadChildren: () => import('./features/communication/communication.routes').then(m => m.COMMUNICATION_ROUTES)
            },
            {
                path: 'statutory-reports',
                canActivate: [packageFeatureGuard('statutory_reports')],
                loadChildren: () => import('./features/statutory-reports/statutory-reports.routes').then(m => m.STATUTORY_REPORTS_ROUTES)
            },
            {
                // Analytics temporarily hidden for all users — restore the loadChildren block to re-enable
                path: 'analytics',
                redirectTo: 'dashboard',
                pathMatch: 'full'
                // canActivate: [packageFeatureGuard('analytics')],
                // loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.analyticsRoutes)
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
                path: 'admin-settings',
                loadChildren: () => import('./features/admin-settings/admin-settings.routes').then(m => m.ADMIN_SETTINGS_ROUTES)
            },
            {
                path: 'settings',
                loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES)
            },
            {
                path: 'notifications',
                loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.NOTIFICATIONS_ROUTES)
            },
            {
                path: 'feedback',
                loadChildren: () => import('./features/feedback/feedback.routes').then(m => m.FEEDBACK_ROUTES)
            },
            {
                path: 'audit-log',
                canActivate: [packageFeatureGuard('audit_log')],
                loadChildren: () => import('./features/audit-log/audit-log.routes').then(m => m.AUDIT_LOG_ROUTES)
            },
            {
                path: 'e-invoices',
                canActivate: [packageFeatureGuard('e_invoice')],
                loadChildren: () => import('./features/e-invoices/e-invoices.routes').then(m => m.E_INVOICES_ROUTES)
            },
            {
                path: 'billing',
                loadChildren: () => import('./features/billing/billing.routes').then(m => m.BILLING_ROUTES)
            },
            {
                path: 'upgrade',
                loadChildren: () => import('./features/billing/billing.routes').then(m => m.UPGRADE_ROUTES)
            },
            {
                path: 'admin/subscriptions',
                loadChildren: () => import('./features/admin-subscriptions/admin-subscriptions.routes').then(m => m.ADMIN_SUBSCRIPTIONS_ROUTES)
            },
            {
                path: 'projects',
                loadChildren: () => import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES)
            },
            {
                path: 'finance',
                loadChildren: () => import('./features/finance/finance.routes').then(m => m.FINANCE_ROUTES)
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
