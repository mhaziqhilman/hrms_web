import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin', 'manager'])],
    loadComponent: () => import('./components/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    data: { title: 'Projects' }
  },
  {
    path: 'new',
    canActivate: [roleGuard(['super_admin', 'admin', 'manager'])],
    loadComponent: () => import('./components/project-form/project-form.component')
      .then(m => m.ProjectFormComponent),
    data: { title: 'New Project' }
  },
  {
    path: ':id',
    canActivate: [roleGuard(['super_admin', 'admin', 'manager'])],
    loadComponent: () => import('./components/project-detail/project-detail.component')
      .then(m => m.ProjectDetailComponent),
    data: { title: 'Project Detail' }
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard(['super_admin', 'admin', 'manager'])],
    loadComponent: () => import('./components/project-form/project-form.component')
      .then(m => m.ProjectFormComponent),
    data: { title: 'Edit Project' }
  }
];
