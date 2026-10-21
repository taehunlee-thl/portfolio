import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { UserView } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

/**
 * Holds the authenticated user as a signal so any component/guard can read it reactively, and
 * owns the login/register/refresh/logout HTTP calls. Token *storage* is delegated to
 * {@link TokenStorageService}; attaching the token to outgoing requests is the interceptor's job
 * (see `auth.interceptor.ts`) — this service never touches HttpHeaders directly.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<UserView | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly tokens: TokenStorageService,
  ) {}

  /** Called once at app startup — see app.config.ts. Silently no-ops if there's no stored session. */
  bootstrap(): Observable<UserView | null> {
    if (!this.tokens.accessToken) {
      return new Observable((subscriber) => {
        subscriber.next(null);
        subscriber.complete();
      });
    }
    return new Observable<UserView | null>((subscriber) => {
      this.http.get<UserView>(`${environment.apiBaseUrl}/users/me`).subscribe({
        next: (user) => {
          this.currentUserSignal.set(user);
          subscriber.next(user);
          subscriber.complete();
        },
        error: () => {
          this.tokens.clear();
          subscriber.next(null);
          subscriber.complete();
        },
      });
    });
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, request)
      .pipe(tap((res) => this.applySession(res)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, request)
      .pipe(tap((res) => this.applySession(res)));
  }

  /** Used by the HTTP interceptor on a 401 — deliberately doesn't touch currentUser until it succeeds. */
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/refresh`, {
        refreshToken: this.tokens.refreshToken,
      })
      .pipe(tap((res) => this.applySession(res)));
  }

  logout(): void {
    this.tokens.clear();
    this.currentUserSignal.set(null);
  }

  private applySession(res: AuthResponse): void {
    this.tokens.setTokens(res.accessToken, res.refreshToken);
    this.currentUserSignal.set(res.user);
  }
}
