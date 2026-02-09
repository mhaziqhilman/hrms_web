import { Routes } from '@angular/router';
import { authGuard } from '@/core/guards/auth.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: ':section',
    canActivate: [authGuard],
    loadComponent: () => import('./components/settings-page/settings-page.component')
      .then(m => m.SettingsPageComponent)
  },
  {
    path: '',
    redirectTo: 'account',
    pathMatch: 'full'
  }
];
