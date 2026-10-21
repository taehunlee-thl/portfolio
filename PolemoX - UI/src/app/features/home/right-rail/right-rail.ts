import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LiveSessionView,
  RankingBoardView,
  TrendingSectorView,
  TrendingSymbolActivityView,
} from '../../../core/models/discovery.model';
import { SessionView } from '../../../core/models/session.model';
import { AuthService } from '../../../core/services/auth.service';
import { DiscoveryService } from '../../../core/services/discovery.service';
import { SessionService } from '../../../core/services/session.service';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { LevelBadgeComponent } from '../../../shared/ui/level-badge/level-badge';
import { SymbolLogoComponent } from '../../../shared/ui/symbol-logo/symbol-logo';
import { YieldValueComponent } from '../../../shared/ui/yield-value/yield-value';

/**
 * The right-hand rail: a personal dashboard card when signed in, then the ambient panels.
 *
 * <p>The panels deliberately differ in shape rather than being four identical ranked lists —
 * traded-symbol flow with a buy/sell pressure bar, sector heat, the trader board, and live
 * battles each read differently so the eye can tell them apart at a glance.
 *
 * <p>Loads its own data: the rail appears on several pages and each panel refreshes on its own
 * terms, so threading all of it through inputs would make every host own data it doesn't use.
 */
@Component({
  selector: 'app-right-rail',
  imports: [RouterLink, LevelBadgeComponent, YieldValueComponent, SymbolLogoComponent, MoneyPipe],
  templateUrl: './right-rail.html',
})
export class RightRail implements OnInit {
  private readonly discovery = inject(DiscoveryService);
  private readonly sessions = inject(SessionService);
  protected readonly auth = inject(AuthService);

  protected readonly flow = signal<TrendingSymbolActivityView[] | null>(null);
  protected readonly sectors = signal<TrendingSectorView[] | null>(null);
  protected readonly topTraders = signal<RankingBoardView | null>(null);
  protected readonly recent = signal<LiveSessionView[] | null>(null);
  protected readonly mine = signal<SessionView[] | null>(null);

  protected readonly myActive = computed(
    () => this.mine()?.filter((s) => s.status === 'ACTIVE' || s.status === 'PENDING') ?? [],
  );

  /** Widest sector bar in the panel, so the bars scale against the busiest sector. */
  protected readonly maxSectorTrades = computed(() =>
    Math.max(1, ...(this.sectors() ?? []).map((s) => s.trades)),
  );

  constructor() {
    // Signing in happens in an overlay, so the rail is already on screen when the user becomes
    // authenticated — loading personal data once in ngOnInit would leave the card showing zeros.
    effect(() => {
      const user = this.auth.currentUser();
      if (!user) {
        this.mine.set(null);
        return;
      }
      this.sessions.mine().subscribe({ next: (s) => this.mine.set(s) });
    });
  }

  ngOnInit(): void {
    this.discovery.trendingSymbols(5).subscribe({ next: (f) => this.flow.set(f) });
    this.discovery.trendingSectors(4).subscribe({ next: (s) => this.sectors.set(s) });
    this.discovery.rankings('BEST_PNL', 4).subscribe({ next: (b) => this.topTraders.set(b) });
    this.discovery.publicSessions().subscribe({ next: (s) => this.recent.set(s) });
  }

  protected sectorWidth(sector: TrendingSectorView): number {
    return Math.round((sector.trades / this.maxSectorTrades()) * 100);
  }
}
