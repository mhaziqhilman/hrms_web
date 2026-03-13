import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const STATUTORY_REPORTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/reports-list/reports-list.component').then(
        (m) => m.ReportsListComponent
      ),
    data: { title: 'Statutory Reports' }
  }
];
