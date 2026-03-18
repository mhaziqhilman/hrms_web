import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const E_INVOICES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent),
    data: { title: 'e-Invoices' }
  },
  // Create and Edit are both handled via dialog
  {
    path: ':id',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
    data: { title: 'Invoice Detail' }
  }
];
