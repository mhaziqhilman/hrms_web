import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const AUDIT_LOG_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin'])],
    loadComponent: () => import('./components/audit-log-list/audit-log-list.component')
      .then(m => m.AuditLogListComponent),
    data: { title: 'Audit Log' }
  }
];
