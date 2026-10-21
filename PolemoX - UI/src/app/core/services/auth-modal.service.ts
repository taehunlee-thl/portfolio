import { Injectable, signal } from '@angular/core';

export type AuthMode = 'login' | 'register';

/**
 * Owns the sign-in overlay, so a gated action interrupts the user in place rather than navigating
 * them away from whatever they were looking at.
 *
 * <p>`pendingAction` is the reason the prompt opened — the thing the user was trying to do. It
 * runs once authentication succeeds, so clicking "Join battle" while signed out joins the battle
 * after signing in instead of dumping them on a landing page to start over.
 */
@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private readonly openSignal = signal(false);
  private readonly modeSignal = signal<AuthMode>('login');
  private readonly reasonSignal = signal<string | null>(null);

  private pendingAction: (() => void) | null = null;

  readonly isOpen = this.openSignal.asReadonly();
  readonly mode = this.modeSignal.asReadonly();
  /** Short line explaining why the prompt appeared, e.g. "Sign in to join this battle". */
  readonly reason = this.reasonSignal.asReadonly();

  open(mode: AuthMode = 'login', options: { reason?: string; then?: () => void } = {}): void {
    this.modeSignal.set(mode);
    this.reasonSignal.set(options.reason ?? null);
    this.pendingAction = options.then ?? null;
    this.openSignal.set(true);
  }

  switchMode(mode: AuthMode): void {
    this.modeSignal.set(mode);
  }

  /** Dismiss without authenticating — the pending action is dropped, not queued for later. */
  close(): void {
    this.openSignal.set(false);
    this.pendingAction = null;
    this.reasonSignal.set(null);
  }

  /** Called by the modal after a successful login/register. */
  completed(): void {
    const action = this.pendingAction;
    this.openSignal.set(false);
    this.pendingAction = null;
    this.reasonSignal.set(null);
    action?.();
  }
}
