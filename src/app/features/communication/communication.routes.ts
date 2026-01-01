import { Routes } from '@angular/router';

export const COMMUNICATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'memos',
    pathMatch: 'full'
  },
  // Memo Routes
  {
    path: 'memos',
    loadComponent: () =>
      import('./components/memo-list/memo-list').then(
        (m) => m.MemoListComponent
      ),
    data: { title: 'Memos & Announcements' }
  },
  {
    path: 'memos/new',
    loadComponent: () =>
      import('./components/memo-form/memo-form').then(
        (m) => m.MemoFormComponent
      ),
    data: { title: 'Create Memo' }
  },
  {
    path: 'memos/:id',
    loadComponent: () =>
      import('./components/memo-viewer/memo-viewer').then(
        (m) => m.MemoViewerComponent
      ),
    data: { title: 'View Memo' }
  },
  {
    path: 'memos/:id/edit',
    loadComponent: () =>
      import('./components/memo-form/memo-form').then(
        (m) => m.MemoFormComponent
      ),
    data: { title: 'Edit Memo' }
  },
  // Policy Routes
  {
    path: 'policies',
    loadComponent: () =>
      import('./components/policy-list/policy-list').then(
        (m) => m.PolicyListComponent
      ),
    data: { title: 'Company Policies' }
  },
  {
    path: 'policies/new',
    loadComponent: () =>
      import('./components/policy-form/policy-form').then(
        (m) => m.PolicyFormComponent
      ),
    data: { title: 'Create Policy' }
  },
  {
    path: 'policies/:id',
    loadComponent: () =>
      import('./components/policy-viewer/policy-viewer').then(
        (m) => m.PolicyViewerComponent
      ),
    data: { title: 'View Policy' }
  },
  {
    path: 'policies/:id/edit',
    loadComponent: () =>
      import('./components/policy-form/policy-form').then(
        (m) => m.PolicyFormComponent
      ),
    data: { title: 'Edit Policy' }
  }
];
