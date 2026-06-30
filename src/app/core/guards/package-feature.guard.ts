import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';

/**
 * Route guard that blocks access when the user's plan lacks a feature.
 *
 *   { path: 'payroll', canActivate: [authGuard, packageFeatureGuard('payroll')], ... }
 *
 * During the Basic-open phase Basic grants everything, so this always passes.
 * On a real miss it redirects to /upgrade with the feature as a query param.
 */
export const packageFeatureGuard = (featureKey: string): CanActivateFn => {
  return () => {
    const subscription = inject(SubscriptionService);
    const router = inject(Router);

    if (subscription.hasFeature(featureKey)) {
      return true;
    }

    router.navigate(['/upgrade'], { queryParams: { feature: featureKey } });
    return false;
  };
};
