import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/employee-list/employee-list.component').then(
        (m) => m.EmployeeListComponent
      ),
    data: { title: 'Employees' }
  },
  {
    path: 'new',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/employee-form/employee-form.component').then(
        (m) => m.EmployeeFormComponent
      ),
    data: { title: 'Add Employee' }
  },
  {
    path: ':id',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/employee-detail/employee-detail.component').then(
        (m) => m.EmployeeDetailComponent
      ),
    data: { title: 'Employee Details' }
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/employee-form/employee-form.component').then(
        (m) => m.EmployeeFormComponent
      ),
    data: { title: 'Edit Employee' }
  }
];
