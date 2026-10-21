import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LeaderboardView, ParticipantView, SESSION_INTERVAL_LABEL, SessionDetailView } from '../../../core/models/session.model';
import { problemMessage } from '../../../core/models/problem-detail.model';
import { AuthService } from '../../../core/services/auth.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { SessionService } from '../../../core/services/session.service';
import { CountdownBarComponent } from '../../../shared/ui/countdown-bar/countdown-bar';
import { LevelBadgeComponent } from '../../../shared/ui/level-badge/level-badge';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge';
import { YieldValueComponent } from '../../../shared/ui/yield-value/yield-value';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { SortByRankPipe } from '../../../shared/pipes/sort-by-rank.pipe';
import { TradeTape } from '../trade-tape/trade-tape';
import { TradingTerminal } from '../trading-terminal/trading-terminal';

@Component({
  selector: 'app-session-detail-page',
  host: { class: 'mx-auto block w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8' },
  imports: [
    RouterLink,
    FormsModule,
    CountdownBarComponent,
    StatusBadgeComponent,
    LevelBadgeComponent,
    YieldValueComponent,
    MoneyPipe,
    SortByRankPipe,
    TradingTerminal,
    TradeTape,
  ],
  templateUrl: './session-detail.page.html',
})
export class SessionDetailPage implements OnInit {
  protected readonly intervalLabels = SESSION_INTERVAL_LABEL;

  protected readonly session = signal<SessionDetailView | null>(null);
  protected readonly leaderboard = signal<LeaderboardView | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionPending = signal(false);
  protected readonly inviteUsername = signal('');
  protected readonly inviteMessage = signal<string | null>(null);
  protected readonly copied = signal(false);

  protected readonly isCreator = computed(() => {
    const session = this.session();
    const user = this.auth.currentUser();
    return !!session && !!user && session.creatorUsername === user.username;
  });

  protected readonly myParticipant = computed<ParticipantView | null>(() => {
    const session = this.session();
    const user = this.auth.currentUser();
    if (!session || !user) return null;
    return session.participants.find((p) => p.user.id === user.id) ?? null;
  });

  protected readonly canStartNow = computed(() => {
    const session = this.session();
    return !!session && session.status === 'PENDING' && session.participants.length >= 2;
  });

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly sessionId = Number(this.route.snapshot.paramMap.get('id'));

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.sessionService.get(this.sessionId).subscribe({
      next: (session) => {
        this.session.set(session);
        this.loading.set(false);
        if (session.status === 'ACTIVE') {
          this.loadLeaderboard();
          this.watchLive();
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(problemMessage(err, 'Could not load this session.'));
      },
    });
  }

  private loadLeaderboard(): void {
    this.sessionService.leaderboard(this.sessionId).subscribe({ next: (lb) => this.leaderboard.set(lb) });
  }

  private watchLive(): void {
    this.realtime
      .watchLeaderboard(this.sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lb) => this.leaderboard.set(lb));

    this.realtime
      .watchStatus(this.sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg) => {
        if (msg.status !== 'ACTIVE') {
          this.load(); // battle just ended — pull the finalised session + results
        }
      });
  }

  protected sendInvite(): void {
    const username = this.inviteUsername().trim();
    if (!username) return;
    this.actionPending.set(true);
    this.inviteMessage.set(null);
    this.sessionService.invite(this.sessionId, username).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.inviteUsername.set('');
        this.inviteMessage.set(`Invited @${username}.`);
      },
      error: (err) => {
        this.actionPending.set(false);
        this.inviteMessage.set(problemMessage(err, 'Could not send that invite.'));
      },
    });
  }

  protected copyJoinCode(): void {
    const code = this.session()?.joinCode;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  protected startNow(): void {
    this.actionPending.set(true);
    this.sessionService.start(this.sessionId).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.load();
      },
      error: (err) => {
        this.actionPending.set(false);
        this.errorMessage.set(problemMessage(err, 'Could not start the session.'));
      },
    });
  }

  protected cancelSession(): void {
    this.actionPending.set(true);
    this.sessionService.cancel(this.sessionId).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.actionPending.set(false);
        this.errorMessage.set(problemMessage(err, 'Could not cancel the session.'));
      },
    });
  }
}
