import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    data: { title: 'Projects' }
  },
  {
    path: ':id',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/project-detail/project-detail.component')
      .then(m => m.ProjectDetailComponent),
    data: { title: 'Project Detail' }
  }
];
