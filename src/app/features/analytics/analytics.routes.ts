import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const analyticsRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/analytics-dashboard/analytics-dashboard.component').then(
        (m) => m.AnalyticsDashboardComponent
      )
  }
];
