import { Routes } from '@angular/router';

export const CLAIMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/claim-list/claim-list.component').then(
        (m) => m.ClaimListComponent
      ),
    data: { title: 'Claims Management' }
  },
  {
    path: 'submit',
    loadComponent: () =>
      import('./components/claim-form/claim-form.component').then(
        (m) => m.ClaimFormComponent
      ),
    data: { title: 'Submit Claim' }
  },
  {
    path: 'approval',
    loadComponent: () =>
      import('./components/claim-approval/claim-approval.component').then(
        (m) => m.ClaimApprovalComponent
      ),
    data: { title: 'Claim Approval' }
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/claim-form/claim-form.component').then(
        (m) => m.ClaimFormComponent
      ),
    data: { title: 'Edit Claim' }
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/claim-form/claim-form.component').then(
        (m) => m.ClaimFormComponent
      ),
    data: { title: 'View Claim' }
  }
];
