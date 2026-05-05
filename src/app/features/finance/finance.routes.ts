import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin', 'manager'])],
    loadComponent: () => import('./components/finance-dashboard/finance-dashboard.component')
      .then(m => m.FinanceDashboardComponent),
    data: { title: 'Finance' }
  },
  {
    path: 'bills',
    canActivate: [roleGuard(['super_admin', 'admin', 'manager'])],
    loadComponent: () => import('./components/bill-list/bill-list.component')
      .then(m => m.BillListComponent),
    data: { title: 'Bills & POs' }
  },
  {
    path: 'bills/:id',
    canActivate: [roleGuard(['super_admin', 'admin', 'manager'])],
    loadComponent: () => import('./components/bill-detail/bill-detail.component')
      .then(m => m.BillDetailComponent),
    data: { title: 'Bill Detail' }
  }
];
