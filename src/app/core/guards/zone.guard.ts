import { inject } from '@angular/core';
import { Router, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { ZoneService } from '../services/zone.service';

/**
 * App Zone Guard
 * Protects the HRMS application routes so they only render on hr.nextura.my.
 * If a user reaches an app route while on the marketing root (nextura.my),
 * hard-redirect the browser to the same path on hr.nextura.my (which owns
 * the auth token in its own localStorage).
 * On localhost / native / preview builds ('dev') this is a no-op.
 */
export const appZoneGuard: CanActivateFn = (
  _route,
  state: RouterStateSnapshot
) => {
  const zone = inject(ZoneService);

  if (zone.zone === 'root') {
    window.location.href = zone.appUrl(state.url);
    return false;
  }
  return true;
};

/**
 * Root Zone Guard
 * Guards the marketing landing page so it only renders on nextura.my.
 * If a user hits '/' while on hr.nextura.my, send them into the app
 * (authGuard on /dashboard bounces them to login when not signed in).
 */
export const rootZoneGuard: CanActivateFn = () => {
  const zone = inject(ZoneService);

  if (zone.zone === 'app') {
    return inject(Router).parseUrl('/dashboard');
  }
  return true;
};
