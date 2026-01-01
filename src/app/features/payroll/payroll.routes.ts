import { Routes } from '@angular/router';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/payroll-list/payroll-list.component').then(
        (m) => m.PayrollListComponent
      ),
    data: { title: 'Payroll Management' }
  },
  {
    path: 'calculate',
    loadComponent: () =>
      import('./components/payroll-form/payroll-form.component').then(
        (m) => m.PayrollFormComponent
      ),
    data: { title: 'Calculate Payroll' }
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/payroll-form/payroll-form.component').then(
        (m) => m.PayrollFormComponent
      ),
    data: { title: 'Edit Payroll' }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/payslip-view/payslip-view.component').then(
        (m) => m.PayslipViewComponent
      ),
    data: { title: 'Payslip' }
  }
];
