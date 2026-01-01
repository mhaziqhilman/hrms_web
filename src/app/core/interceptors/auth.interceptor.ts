import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TOKEN_KEY } from '../config/api.config';

/**
 * Auth Interceptor (Functional)
 * Automatically adds JWT token to outgoing requests
 * Handles 401 Unauthorized responses
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError(error => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.status === 401) {
        // Clear storage
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('hrms_user');

        // Redirect to login unless already there
        if (!router.url.includes('/auth/login')) {
          router.navigate(['/auth/login'], {
            queryParams: { returnUrl: router.url }
          });
        }
      }

      return throwError(() => error);
    })
  );
};
