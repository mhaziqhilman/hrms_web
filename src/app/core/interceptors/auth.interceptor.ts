import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, API_CONFIG } from '../config/api.config';
import { AuthService } from '../services/auth.service';

/**
 * Auth Interceptor (Functional)
 * Automatically adds JWT token to outgoing requests.
 * On 401 response, attempts a silent token refresh before giving up.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = localStorage.getItem(TOKEN_KEY);

  // Attach token to request
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(error => {
      // Only attempt refresh on 401 errors, and skip the refresh-token endpoint itself
      // to avoid infinite loops
      const isRefreshEndpoint = req.url.includes(API_CONFIG.endpoints.auth.refreshToken);
      const hasRefreshToken = !!localStorage.getItem(REFRESH_TOKEN_KEY);

      if (error.status === 401 && !isRefreshEndpoint && hasRefreshToken) {
        // Attempt silent refresh
        return authService.refreshTokenRequest().pipe(
          switchMap(response => {
            if (response.success && response.data?.token) {
              // Retry original request with new token
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${response.data.token}` }
              });
              return next(retryReq);
            }
            clearAndRedirect(router);
            return throwError(() => error);
          }),
          catchError(() => {
            clearAndRedirect(router);
            return throwError(() => error);
          })
        );
      }

      if (error.status === 401) {
        clearAndRedirect(router);
      }

      return throwError(() => error);
    })
  );
};

function clearAndRedirect(router: Router): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('hrms_user');
  if (!router.url.includes('/auth/login')) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: router.url }
    });
  }
}
