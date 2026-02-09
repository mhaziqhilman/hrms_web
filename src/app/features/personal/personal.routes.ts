import { Routes } from '@angular/router';
import { authGuard } from '@/core/guards/auth.guard';

export const personalRoutes: Routes = [
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/my-profile/my-profile.component').then(
        (m) => m.MyProfileComponent
      )
  },
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  }
];
