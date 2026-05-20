import { Routes } from '@angular/router';

export const COMMUNICATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'memos',
    pathMatch: 'full'
  },
  // Announcement Routes
  {
    path: 'memos',
    loadComponent: () =>
      import('./components/memo-list/memo-list').then(
        (m) => m.MemoListComponent
      ),
    data: { title: 'Announcements', layout: 'full' }
  },
  {
    path: 'memos/new',
    loadComponent: () =>
      import('./components/memo-form/memo-form').then(
        (m) => m.MemoFormComponent
      ),
    data: { title: 'Create Announcement', layout: 'full' }
  },
  {
    path: 'memos/:id',
    loadComponent: () =>
      import('./components/memo-viewer/memo-viewer').then(
        (m) => m.MemoViewerComponent
      ),
    // 'full' so the viewer's header rail can run edge-to-edge; the component
    // re-applies a reading-width wrapper around the content workspace itself.
    data: { title: 'View Announcement', layout: 'full' }
  },
  {
    path: 'memos/:id/edit',
    loadComponent: () =>
      import('./components/memo-form/memo-form').then(
        (m) => m.MemoFormComponent
      ),
    data: { title: 'Edit Announcement', layout: 'full' }
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
    data: { title: 'Create Policy', layout: 'reading' }
  },
  {
    path: 'policies/:id',
    loadComponent: () =>
      import('./components/policy-viewer/policy-viewer').then(
        (m) => m.PolicyViewerComponent
      ),
    data: { title: 'View Policy', layout: 'reading' }
  },
  {
    path: 'policies/:id/edit',
    loadComponent: () =>
      import('./components/policy-form/policy-form').then(
        (m) => m.PolicyFormComponent
      ),
    data: { title: 'Edit Policy', layout: 'reading' }
  }
];
