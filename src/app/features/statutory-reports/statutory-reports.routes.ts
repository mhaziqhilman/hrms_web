import { Routes } from '@angular/router';

export const STATUTORY_REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/reports-list/reports-list.component').then(
        (m) => m.ReportsListComponent
      ),
    data: { title: 'Statutory Reports' }
  }
];
