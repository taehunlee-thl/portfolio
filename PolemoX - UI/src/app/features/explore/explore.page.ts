import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LiveSessionView } from '../../core/models/discovery.model';
import { problemMessage } from '../../core/models/problem-detail.model';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { AuthService } from '../../core/services/auth.service';
import { DiscoveryService } from '../../core/services/discovery.service';
import { SessionService } from '../../core/services/session.service';
import { RightRail } from '../home/right-rail/right-rail';
import { LiveBattles } from '../discovery/live-battles/live-battles';

/** Matches the server's public-board cache TTL. */
const REFRESH_MS = 30_000;

type Filter = 'all' | 'live' | 'open';

/**
 * The full public board. Rankings live on their own route now, so this page does one job: find a
 * battle to join or watch.
 */
@Component({
  selector: 'app-explore-page',
  imports: [LiveBattles, RightRail],
  templateUrl: './explore.page.html',
})
export class ExplorePage implements OnInit {
  private readonly discovery = inject(DiscoveryService);
  private readonly sessionService = inject(SessionService);
  private readonly authModal = inject(AuthModalService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly filter = signal<Filter>('all');
  protected readonly sessions = signal<LiveSessionView[] | null>(null);
  protected readonly joinPending = signal<number | null>(null);
  protected readonly leavePending = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  /** Battles the signed-in user is seated in — drives Join vs Leave on each card. */
  protected readonly joinedSessionIds = signal<number[]>([]);

  protected readonly filtered = computed(() => {
    const all = this.sessions();
    if (!all) return null;
    switch (this.filter()) {
      case 'live':
        return all.filter((s) => s.status === 'ACTIVE');
      case 'open':
        return all.filter((s) => s.status === 'PENDING' && s.participantCount < s.maxParticipants);
      default:
        return all;
    }
  });

  constructor() {
    const timer = setInterval(() => this.load(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    this.load();
    this.refreshMine();
  }

  protected select(filter: Filter): void {
    this.filter.set(filter);
  }

  /** Forfeiting a running battle is irreversible, so that case is confirmed first. */
  protected onLeave(session: LiveSessionView): void {
    if (session.status === 'ACTIVE') {
      const confirmed = confirm(
        `Forfeit “${session.name}”?\n\nThe battle is already running, so leaving drops you from the standings and you'll earn no XP. This can't be undone.`,
      );
      if (!confirmed) return;
    }

    this.leavePending.set(session.id);
    this.errorMessage.set(null);
    this.sessionService.leave(session.id).subscribe({
      next: () => {
        this.leavePending.set(null);
        this.load();
        this.refreshMine();
      },
      error: (err) => {
        this.leavePending.set(null);
        this.errorMessage.set(problemMessage(err, "Couldn't leave that battle."));
      },
    });
  }

  private refreshMine(): void {
    if (!this.auth.isAuthenticated()) {
      this.joinedSessionIds.set([]);
      return;
    }
    this.sessionService.mine().subscribe({
      next: (sessions) => this.joinedSessionIds.set(sessions.map((s) => s.id)),
    });
  }

  protected onJoin(session: LiveSessionView): void {
    if (!this.auth.isAuthenticated()) {
      this.authModal.open('login', {
        reason: `Sign in to join “${session.name}”.`,
        then: () => this.join(session),
      });
      return;
    }
    this.join(session);
  }

  protected onOpen(session: LiveSessionView): void {
    this.router.navigate(['/sessions', session.id]);
  }

  private join(session: LiveSessionView): void {
    this.joinPending.set(session.id);
    this.errorMessage.set(null);
    this.sessionService.joinPublic(session.id).subscribe({
      next: () => {
        this.joinPending.set(null);
        this.refreshMine();
        this.router.navigate(['/sessions', session.id]);
      },
      error: (err) => {
        this.joinPending.set(null);
        this.errorMessage.set(problemMessage(err, "Couldn't join that battle."));
        this.load();
      },
    });
  }

  private load(): void {
    this.discovery.publicSessions().subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: () => this.sessions.update((current) => current ?? []),
    });
  }
}
