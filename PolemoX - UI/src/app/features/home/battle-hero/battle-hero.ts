import { Component, computed, input, output } from '@angular/core';
import { EquitySeriesView, FeaturedBattleView } from '../../../core/models/discovery.model';
import { SESSION_INTERVAL_LABEL } from '../../../core/models/session.model';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { BattleChartComponent } from '../../../shared/ui/battle-chart/battle-chart';
import { CountdownBarComponent } from '../../../shared/ui/countdown-bar/countdown-bar';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge';
import { YieldValueComponent } from '../../../shared/ui/yield-value/yield-value';

/** Must match `SERIES_COLORS` in the chart so the legend swatches identify the right lines. */
const SERIES_COLORS = ['#c6a356', '#5a9fd4', '#9b7fc4', '#4fb49a', '#d4885a', '#c45a7c'];

/**
 * The home page's headline card: one battle shown as a standings table beside its performance
 * chart, with the actions to watch or join it.
 */
@Component({
  selector: 'app-battle-hero',
  imports: [
    BattleChartComponent,
    CountdownBarComponent,
    StatusBadgeComponent,
    YieldValueComponent,
    MoneyPipe,
  ],
  templateUrl: './battle-hero.html',
})
export class BattleHero {
  readonly battle = input.required<FeaturedBattleView>();
  readonly joinPending = input(false);

  readonly join = output<FeaturedBattleView>();
  readonly open = output<FeaturedBattleView>();

  protected readonly intervalLabels = SESSION_INTERVAL_LABEL;

  protected readonly hasChart = computed(() => this.battle().timeline.length > 1);

  protected readonly canJoin = computed(() => {
    const s = this.battle().session;
    return s.status === 'PENDING' && s.participantCount < s.maxParticipants;
  });

  /** Chart line colour for a trader, matched by their position in the series list. */
  protected colorFor(username: string): string {
    const index = this.battle().series.findIndex((s: EquitySeriesView) => s.username === username);
    return SERIES_COLORS[(index < 0 ? 0 : index) % SERIES_COLORS.length];
  }
}
