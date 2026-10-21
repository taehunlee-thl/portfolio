import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FeaturedBattleView,
  LiveSessionView,
  MarketPulseView,
  PlatformStatsView,
} from '../../core/models/discovery.model';
import { problemMessage } from '../../core/models/problem-detail.model';
import { SessionInterval } from '../../core/models/session.model';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { AuthService } from '../../core/services/auth.service';
import { DiscoveryService } from '../../core/services/discovery.service';
import { SessionService } from '../../core/services/session.service';
import { LiveBattles } from '../discovery/live-battles/live-battles';
import { BattleHero } from './battle-hero/battle-hero';
import { RightRail } from './right-rail/right-rail';
import { TickerTape } from './ticker-tape/ticker-tape';

/** Matched to the server's public-board cache TTL — polling faster just re-reads the same payload. */
const REFRESH_MS = 30_000;

type CategoryId = 'trending' | 'live' | 'open' | SessionInterval;

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'live', label: 'Live now' },
  { id: 'open', label: 'Open seats' },
  { id: 'ONE_HOUR', label: '1 hour' },
  { id: 'ONE_DAY', label: '1 day' },
  { id: 'THREE_DAY', label: '3 day' },
  { id: 'SEVEN_DAY', label: '7 day' },
  { id: 'THIRTY_DAY', label: '30 day' },
];

/**
 * The front door, identical whether or not you're signed in: a headline battle with its chart and
 * standings, the ambient rail, and the full board below.
 *
 * <p>Nothing here redirects an anonymous visitor. Gated actions raise the sign-in overlay and
 * resume afterwards, so the page you were reading is still behind the prompt when it closes.
 */
@Component({
  selector: 'app-home-page',
  imports: [BattleHero, RightRail, LiveBattles, TickerTape],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  private readonly discovery = inject(DiscoveryService);
  private readonly sessionService = inject(SessionService);
  private readonly authModal = inject(AuthModalService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly categories = CATEGORIES;
  protected readonly category = signal<CategoryId>('trending');

  protected readonly featured = signal<FeaturedBattleView[] | null>(null);
  protected readonly sessions = signal<LiveSessionView[] | null>(null);
  protected readonly stats = signal<PlatformStatsView | null>(null);
  protected readonly heroIndex = signal(0);
  protected readonly joinPending = signal<number | null>(null);
  protected readonly leavePending = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pulseSymbols = signal<MarketPulseView['symbols']>([]);
  /** Battles the signed-in user is seated in — drives Join vs Leave on each card. */
  protected readonly joinedSessionIds = signal<number[]>([]);

  protected readonly hero = computed(() => {
    const list = this.featured() ?? [];
    return list.length === 0 ? null : list[Math.min(this.heroIndex(), list.length - 1)];
  });

  protected readonly filtered = computed(() => {
    const all = this.sessions();
    if (!all) return null;
    switch (this.category()) {
      case 'trending':
        return all;
      case 'live':
        return all.filter((s) => s.status === 'ACTIVE');
      case 'open':
        return all.filter((s) => s.status === 'PENDING' && s.participantCount < s.maxParticipants);
      default:
        return all.filter((s) => s.interval === this.category());
    }
  });

  constructor() {
    const timer = setInterval(() => this.load(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    this.load();
    this.discovery.stats().subscribe({ next: (s) => this.stats.set(s) });
    this.discovery.market().subscribe({ next: (p) => this.pulseSymbols.set(p.symbols) });
    this.refreshMine();
  }

  protected select(category: CategoryId): void {
    this.category.set(category);
  }

  protected cycleHero(direction: -1 | 1): void {
    const count = this.featured()?.length ?? 0;
    if (count === 0) return;
    this.heroIndex.update((i) => (i + direction + count) % count);
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

  /**
   * Leaving a lobby just frees the seat; leaving a running battle forfeits it, which is
   * irreversible and costs the trader their standing, so that case is confirmed first.
   */
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
    this.discovery.featured(5).subscribe({ next: (f) => this.featured.set(f) });
    this.discovery.publicSessions().subscribe({
      next: (s) => this.sessions.set(s),
      // Keep what's on screen rather than blanking the board on a transient failure.
      error: () => this.sessions.update((current) => current ?? []),
    });
  }
}
