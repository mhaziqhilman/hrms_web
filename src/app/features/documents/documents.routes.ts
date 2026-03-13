import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/document-overview/document-overview.component').then(m => m.DocumentOverviewComponent),
    data: { title: 'Document Management' }
  }
];
