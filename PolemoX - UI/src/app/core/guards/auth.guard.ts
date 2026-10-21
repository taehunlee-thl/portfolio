import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthModalService } from '../services/auth-modal.service';
import { AuthService } from '../services/auth.service';

/**
 * Guards a route without navigating anyone to a login page.
 *
 * <p>An anonymous visitor who lands on a gated URL is sent home with the sign-in overlay already
 * open and the original destination queued, so completing the form lands them where they meant to
 * go. Cancelling leaves them on a usable page instead of a dead end.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const authModal = inject(AuthModalService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  authModal.open('login', {
    reason: 'Sign in to continue.',
    then: () => router.navigateByUrl(state.url),
  });
  return router.createUrlTree(['/']);
};

/**
 * Kept for the legacy `/login` and `/register` URLs, which are now overlays rather than pages:
 * it bounces to home and opens the right tab so old links and bookmarks still work.
 */
export const authRedirectGuard = (mode: 'login' | 'register'): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const authModal = inject(AuthModalService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      authModal.open(mode);
    }
    return router.createUrlTree(['/']);
  };
};
