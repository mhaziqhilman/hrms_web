import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const E_INVOICES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent),
    data: { title: 'e-Invoices' }
  },
  // Page-form route — must be declared before ':id' or it gets captured as a public_id
  {
    path: 'new',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
    data: { title: 'Invoice Form' }
  },
  {
    path: ':id',
    canActivate: [roleGuard(['super_admin', 'admin'])],
    loadComponent: () => import('./components/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
    data: { title: 'Invoice Detail' }
  }
];
