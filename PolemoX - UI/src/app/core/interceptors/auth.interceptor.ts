import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthResponse } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

// Module-level (not injected) so every request through this interceptor function shares the same
// in-flight refresh, however many components fire requests concurrently — without this, N
// concurrently-401ing requests would each kick off their own refresh call.
let refreshInFlight: Observable<AuthResponse> | null = null;

/**
 * Attaches the access token to every request, and on a 401 transparently refreshes it once and
 * retries. A 401 on the refresh call itself (or on any request once refreshing has already
 * failed) logs the user out and sends them to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const accessToken = tokens.accessToken;
  const authedReq = accessToken ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }) : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      const isAuthEndpoint = req.url.includes('/auth/');
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      if (!refreshInFlight) {
        refreshInFlight = auth.refresh().pipe(
          shareReplay(1),
          finalize(() => (refreshInFlight = null)),
        );
      }

      return refreshInFlight.pipe(
        switchMap(() => {
          const retryToken = tokens.accessToken;
          const retryReq = retryToken
            ? req.clone({ setHeaders: { Authorization: `Bearer ${retryToken}` } })
            : req;
          return next(retryReq);
        }),
        catchError((refreshError: unknown) => {
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
