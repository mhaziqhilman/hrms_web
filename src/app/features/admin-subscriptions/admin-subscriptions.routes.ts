import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const ADMIN_SUBSCRIPTIONS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin'])],
    loadComponent: () =>
      import('./admin-subscriptions-page.component').then(m => m.AdminSubscriptionsPageComponent),
    data: { title: 'Subscriptions' }
  }
];
