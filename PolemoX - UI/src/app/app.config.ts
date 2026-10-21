import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

// No provideZoneChangeDetection here: this project has no zone.js dependency (Angular's modern
// default), so change detection is zoneless — signals and RxJS-via-async-pipe/subscribe-with-
// signal-write drive updates instead of Zone patching. Every state mutation in this app already
// goes through a signal for that reason.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Blocks initial render until we know whether a stored token is still valid — without this,
    // authGuard would see "logged out" for a split second on every hard refresh and bounce a
    // legitimately signed-in user to /login.
    provideAppInitializer(() => firstValueFrom(inject(AuthService).bootstrap())),
  ],
};
