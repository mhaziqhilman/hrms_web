import { Routes } from '@angular/router';

export const OVERTIME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/ot-list/ot-list.component').then((m) => m.OtListComponent),
    data: { title: 'Overtime', layout: 'full' }
  },
  {
    path: 'approval',
    loadComponent: () =>
      import('./components/ot-approval/ot-approval.component').then((m) => m.OtApprovalComponent),
    data: { title: 'Overtime Approvals' }
  }
];
