import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const USER_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () =>
      import('./components/user-list/user-list.component').then(
        (m) => m.UserListComponent
      ),
    data: { title: 'User Management' }
  }
];
