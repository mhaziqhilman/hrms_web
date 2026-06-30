import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/finance-dashboard/finance-dashboard.component')
      .then(m => m.FinanceDashboardComponent),
    data: { title: 'Finance' }
  },
  {
    path: 'cashflow',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/cashflow-list/cashflow-list.component')
      .then(m => m.CashFlowListComponent),
    data: { title: 'Cash Flow' }
  },
  {
    path: 'cashflow/:id',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/cashflow-editor/cashflow-editor.component')
      .then(m => m.CashFlowEditorComponent),
    data: { title: 'Cash Flow Forecast', layout: 'wide' }
  },
  {
    path: 'bills',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/bill-list/bill-list.component')
      .then(m => m.BillListComponent),
    data: { title: 'Bills & POs' }
  },
  {
    path: 'bills/:id',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/bill-detail/bill-detail.component')
      .then(m => m.BillDetailComponent),
    data: { title: 'Bill Detail' }
  }
];
