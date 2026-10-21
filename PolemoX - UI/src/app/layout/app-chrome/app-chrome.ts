import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModal } from '../../features/auth/auth-modal/auth-modal';
import { LevelBadgeComponent } from '../../shared/ui/level-badge/level-badge';
import { TraderSearch } from '../trader-search/trader-search';

/**
 * The frame every page renders inside: top bar, category strip, and the sign-in overlay.
 *
 * <p>One chrome for signed-in and signed-out alike. The previous build had a separate marketing
 * page and an authenticated shell with different navigation, which meant signing in visibly threw
 * away the page you were on. Here authentication only changes what the top-right corner offers.
 */
@Component({
  selector: 'app-chrome',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AuthModal, LevelBadgeComponent, TraderSearch],
  templateUrl: './app-chrome.html',
})
export class AppChrome {
  protected readonly auth = inject(AuthService);
  protected readonly authModal = inject(AuthModalService);
  private readonly router = inject(Router);

  protected readonly userMenuOpen = signal(false);

  protected signIn(): void {
    this.authModal.open('login');
  }

  protected signUp(): void {
    this.authModal.open('register');
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected signOut(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/']);
  }

  /** Gated top-bar links prompt in place instead of bouncing an anonymous user to a login page. */
  protected goGated(path: string, reason: string): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate([path]);
    } else {
      this.authModal.open('login', { reason, then: () => this.router.navigate([path]) });
    }
  }
}
