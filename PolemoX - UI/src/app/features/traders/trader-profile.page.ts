import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TraderProfileView } from '../../core/models/discovery.model';
import { problemMessage } from '../../core/models/problem-detail.model';
import { DiscoveryService } from '../../core/services/discovery.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { LevelBadgeComponent } from '../../shared/ui/level-badge/level-badge';
import { SymbolLogoComponent } from '../../shared/ui/symbol-logo/symbol-logo';
import { TagComponent } from '../../shared/ui/tag/tag';
import { YieldValueComponent } from '../../shared/ui/yield-value/yield-value';
import { RightRail } from '../home/right-rail/right-rail';

/**
 * A trader's public record: placings, trading habits and what they trade.
 *
 * <p>Deliberately shows nothing about open positions — scouting a live opponent's book mid-battle
 * would be an unfair advantage, so the backend doesn't expose it and this page can't leak it.
 */
@Component({
  selector: 'app-trader-profile-page',
  imports: [
    RouterLink,
    LevelBadgeComponent,
    YieldValueComponent,
    SymbolLogoComponent,
    TagComponent,
    MoneyPipe,
    RightRail,
  ],
  templateUrl: './trader-profile.page.html',
})
export class TraderProfilePage implements OnInit {
  private readonly discovery = inject(DiscoveryService);
  private readonly route = inject(ActivatedRoute);

  protected readonly profile = signal<TraderProfileView | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  /** Scales the favourite-symbol bars against this trader's most-traded ticker. */
  protected readonly maxSymbolTrades = computed(() =>
    Math.max(1, ...(this.profile()?.favouriteSymbols ?? []).map((s) => s.trades)),
  );

  ngOnInit(): void {
    // Re-fetch on param change so navigating between traders from the rail actually reloads.
    this.route.paramMap.subscribe((params) => {
      const username = params.get('username');
      if (username) {
        this.load(username);
      }
    });
  }

  protected barWidth(trades: number): number {
    return Math.round((trades / this.maxSymbolTrades()) * 100);
  }

  private load(username: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.discovery.trader(username).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.profile.set(null);
        this.errorMessage.set(problemMessage(err, `No trader found called “${username}”.`));
      },
    });
  }
}
