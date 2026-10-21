import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import {
  RANKING_CATEGORIES,
  RankingBoardView,
  RankingCategory,
  RankingEntryView,
} from '../../../core/models/discovery.model';
import { DiscoveryService } from '../../../core/services/discovery.service';
import { LevelBadgeComponent } from '../../../shared/ui/level-badge/level-badge';
import { YieldValueComponent } from '../../../shared/ui/yield-value/yield-value';

/**
 * Trader leaderboard, sortable across several categories.
 *
 * <p>Each category is a separate request rather than a client-side re-sort: the server decides
 * eligibility per category (e.g. win rate needs a minimum number of battles), so re-sorting the XP
 * board locally would silently show a different population than the one the server would rank.
 */
@Component({
  selector: 'app-rankings-board',
  imports: [LevelBadgeComponent, YieldValueComponent],
  templateUrl: './rankings-board.html',
})
export class RankingsBoard implements OnInit {
  readonly limit = input(10);

  private readonly discovery = inject(DiscoveryService);

  protected readonly categories = RANKING_CATEGORIES;
  protected readonly selected = signal<RankingCategory>('XP');
  protected readonly board = signal<RankingBoardView | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly activeMeta = computed(
    () => this.categories.find((c) => c.id === this.selected()) ?? this.categories[0],
  );

  ngOnInit(): void {
    this.load('XP');
  }

  protected select(category: RankingCategory): void {
    if (category === this.selected()) return;
    this.selected.set(category);
    this.load(category);
  }

  /** The column a row is actually ranked on, formatted for its category's units. */
  protected scoreLabel(entry: RankingEntryView): string {
    switch (this.selected()) {
      case 'XP':
        return `${entry.xpTotal.toLocaleString()} XP`;
      case 'WINS':
        return entry.wins === 1 ? '1 win' : `${entry.wins} wins`;
      case 'WIN_RATE':
        return `${entry.winRatePct.toFixed(1)}%`;
      default:
        return '';
    }
  }

  /** Percentage categories render through the gain/loss component instead of a plain string. */
  protected isPercentCategory(): boolean {
    return this.selected() === 'BEST_PNL' || this.selected() === 'AVG_PNL';
  }

  private load(category: RankingCategory): void {
    this.loading.set(true);
    this.failed.set(false);
    this.discovery.rankings(category, this.limit()).subscribe({
      next: (board) => {
        this.board.set(board);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }
}
