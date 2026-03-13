import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const ADMIN_SETTINGS_ROUTES: Routes = [
  {
    path: ':section',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/admin-settings-page/admin-settings-page.component')
      .then(m => m.AdminSettingsPageComponent)
  },
  {
    path: '',
    redirectTo: 'company',
    pathMatch: 'full'
  }
];
