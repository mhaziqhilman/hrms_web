import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/payroll-list/payroll-list.component').then(
        (m) => m.PayrollListComponent
      ),
    data: { title: 'Payroll Management' }
  },
  {
    path: 'calculate',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/payroll-form/payroll-form.component').then(
        (m) => m.PayrollFormComponent
      ),
    data: { title: 'Calculate Payroll' }
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/payroll-form/payroll-form.component').then(
        (m) => m.PayrollFormComponent
      ),
    data: { title: 'Edit Payroll' }
  },
  {
    path: ':id',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/payslip-view/payslip-view.component').then(
        (m) => m.PayslipViewComponent
      ),
    data: { title: 'Payslip' }
  }
];
