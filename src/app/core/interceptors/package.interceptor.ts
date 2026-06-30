import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { UpgradePromptService } from '../services/upgrade-prompt.service';

/**
 * Catches tier-gating rejections from the backend and shows an upgrade prompt.
 * Codes: FEATURE_LOCKED, LIMIT_REACHED, PACKAGE_UNAVAILABLE (all HTTP 403).
 *
 * Inert in practice during the Basic-open phase (enforcement off), but ready
 * for when tiers launch.
 */
export const packageInterceptor: HttpInterceptorFn = (req, next) => {
  const upgradePrompt = inject(UpgradePromptService);

  return next(req).pipe(
    catchError(error => {
      const code = error?.error?.code;
      if (
        error?.status === 403 &&
        (code === 'FEATURE_LOCKED' || code === 'LIMIT_REACHED' || code === 'PACKAGE_UNAVAILABLE')
      ) {
        const message = error.error?.message;
        const feature = error.error?.feature;
        upgradePrompt.show(message, feature);
      }
      return throwError(() => error);
    })
  );
};
