import { Routes } from '@angular/router';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/document-overview/document-overview.component').then(m => m.DocumentOverviewComponent),
    data: { title: 'Document Management' }
  }
];
