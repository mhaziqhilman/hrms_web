import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard (Functional)
 * Protects routes that require authentication, email verification, and company membership
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check email verification (skip for super_admin for backwards compatibility)
  const user = authService.getCurrentUserValue();
  if (user && !user.email_verified && user.role !== 'super_admin') {
    router.navigate(['/auth/verify-email-pending']);
    return false;
  }

  // Check company membership (skip for super_admin)
  if (user && !user.company_id && user.role !== 'super_admin') {
    router.navigate(['/onboarding']);
    return false;
  }

  return true;
};

/**
 * Onboarding Guard
 * Allows authenticated + verified users to access onboarding pages
 * (both new users without a company AND existing users creating additional companies)
 */
export const onboardingGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const user = authService.getCurrentUserValue();

  // If not verified, redirect to verification pending page
  if (user && !user.email_verified && user.role !== 'super_admin') {
    router.navigate(['/auth/verify-email-pending']);
    return false;
  }

  return true;
};

/**
 * Role Guard Factory
 * Creates a guard that checks for specific roles
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // User doesn't have required role - redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  };
}
