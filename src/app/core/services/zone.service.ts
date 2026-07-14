import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

/**
 * Deployment zone: which nextura.my subdomain the SPA is being served from.
 * - 'root' → nextura.my (marketing landing page only)
 * - 'app'  → hr.nextura.my (the HRMS application + auth)
 * - 'dev'  → localhost, preview builds, or the native mobile app → no gating,
 *            every route stays reachable so we don't break local dev / Capacitor.
 */
export type Zone = 'root' | 'app' | 'dev';

const ROOT_HOST = 'nextura.my';
const APP_HOST = 'hr.nextura.my';

@Injectable({ providedIn: 'root' })
export class ZoneService {
  readonly host = typeof window !== 'undefined' ? window.location.hostname : '';

  /** True only on the real production hosts (nextura.my / *.nextura.my). */
  readonly isProdWeb =
    !Capacitor.isNativePlatform() && this.host.endsWith(ROOT_HOST);

  get zone(): Zone {
    if (!this.isProdWeb) return 'dev';
    return this.host.startsWith('hr.') ? 'app' : 'root';
  }

  /** Absolute URL on the HRMS app subdomain (hr.nextura.my). */
  appUrl(path = '/'): string {
    return `https://${APP_HOST}${path.startsWith('/') ? path : '/' + path}`;
  }

  /** Absolute URL on the marketing root domain (nextura.my). */
  rootUrl(path = '/'): string {
    return `https://${ROOT_HOST}${path.startsWith('/') ? path : '/' + path}`;
  }
}
