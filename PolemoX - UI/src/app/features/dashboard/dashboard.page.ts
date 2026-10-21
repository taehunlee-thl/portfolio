import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InviteView, SESSION_INTERVAL_LABEL, SessionInterval, SessionView } from '../../core/models/session.model';
import { problemMessage } from '../../core/models/problem-detail.model';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { CountdownBarComponent } from '../../shared/ui/countdown-bar/countdown-bar';
import { LevelBadgeComponent } from '../../shared/ui/level-badge/level-badge';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-dashboard-page',
  // The page container lives on the host rather than wrapping the template, because the chrome's
  // router-outlet is deliberately unopinionated about width — full-bleed pages like the home
  // board set their own, wider one.
  host: { class: 'mx-auto block w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8' },
  imports: [RouterLink, FormsModule, CountdownBarComponent, LevelBadgeComponent, StatusBadgeComponent, MoneyPipe],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit {
  protected readonly sessions = signal<SessionView[]>([]);
  protected readonly invites = signal<InviteView[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly respondingTo = signal<number | null>(null);
  protected readonly joinCode = signal('');
  protected readonly joining = signal(false);
  protected readonly joinError = signal<string | null>(null);

  constructor(
    protected readonly auth: AuthService,
    private readonly sessionService: SessionService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.sessionService.mine().subscribe({
      next: (sessions) => {
        // Most relevant first: ACTIVE, then PENDING, then finished ones, newest of each group first.
        const rank: Record<string, number> = { ACTIVE: 0, PENDING: 1, COMPLETED: 2, CANCELLED: 3 };
        this.sessions.set([...sessions].sort((a, b) => rank[a.status] - rank[b.status]));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(problemMessage(err, 'Could not load your sessions.'));
      },
    });
    this.sessionService.myInvites().subscribe({ next: (invites) => this.invites.set(invites) });
  }

  protected acceptInvite(invite: InviteView): void {
    this.respondingTo.set(invite.id);
    this.sessionService.acceptInvite(invite.id).subscribe({
      next: () => {
        this.invites.update((list) => list.filter((i) => i.id !== invite.id));
        this.respondingTo.set(null);
        this.load();
      },
      error: (err) => {
        this.respondingTo.set(null);
        this.errorMessage.set(problemMessage(err, 'Could not accept that invite.'));
      },
    });
  }

  protected joinByCode(): void {
    const code = this.joinCode().trim();
    if (!code || this.joining()) return;
    this.joining.set(true);
    this.joinError.set(null);
    this.sessionService.joinByCode(code).subscribe({
      next: (session) => this.router.navigate(['/sessions', session.id]),
      error: (err) => {
        this.joining.set(false);
        this.joinError.set(problemMessage(err, "Couldn't find a joinable session for that code."));
      },
    });
  }

  protected intervalLabel(interval: SessionInterval): string {
    return SESSION_INTERVAL_LABEL[interval];
  }

  protected declineInvite(invite: InviteView): void {
    this.respondingTo.set(invite.id);
    this.sessionService.declineInvite(invite.id).subscribe({
      next: () => {
        this.invites.update((list) => list.filter((i) => i.id !== invite.id));
        this.respondingTo.set(null);
      },
      error: (err) => {
        this.respondingTo.set(null);
        this.errorMessage.set(problemMessage(err, 'Could not decline that invite.'));
      },
    });
  }
}
