import { Routes } from '@angular/router';
import { authGuard } from '@/core/guards/auth.guard';
// import { roleGuard } from '@/core/guards/role.guard';

export const analyticsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () =>
      import('./components/analytics-dashboard/analytics-dashboard.component').then(
        (m) => m.AnalyticsDashboardComponent
      )
  }
];
