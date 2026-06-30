import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./billing-page.component').then(m => m.BillingPageComponent),
    data: { title: 'Billing' }
  }
];

export const UPGRADE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./upgrade-page.component').then(m => m.UpgradePageComponent),
    data: { title: 'Plans & Pricing' }
  }
];
