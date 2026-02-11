import { Routes } from '@angular/router';
import { authGuard } from '@/core/guards/auth.guard';

export const ADMIN_SETTINGS_ROUTES: Routes = [
  {
    path: ':section',
    canActivate: [authGuard],
    loadComponent: () => import('./components/admin-settings-page/admin-settings-page.component')
      .then(m => m.AdminSettingsPageComponent)
  },
  {
    path: '',
    redirectTo: 'company',
    pathMatch: 'full'
  }
];
