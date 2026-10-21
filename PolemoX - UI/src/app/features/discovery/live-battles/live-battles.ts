import { Component, computed, input, output, signal } from '@angular/core';
import { LiveSessionView } from '../../../core/models/discovery.model';
import { SESSION_INTERVAL_LABEL } from '../../../core/models/session.model';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { CountdownBarComponent } from '../../../shared/ui/countdown-bar/countdown-bar';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge';
import { SymbolLogoComponent } from '../../../shared/ui/symbol-logo/symbol-logo';
import { TagComponent } from '../../../shared/ui/tag/tag';
import { YieldValueComponent } from '../../../shared/ui/yield-value/yield-value';

/**
 * The open battle board: every public session as a collapsed summary that expands into standings.
 *
 * <p>Collapsed by default so a dozen battles fit on one screen. The summary row carries the facts
 * that decide whether you care — stake, seats, duration, market, who's hosting, and the leader's
 * return — and the standings table only materialises when asked for.
 *
 * <p>Presentational: it raises {@link join}, {@link leave} and {@link open} and lets the host
 * decide what they mean, because the same board renders on the anonymous home page (where joining
 * must route through sign-in) and inside the app (where it acts immediately).
 */
@Component({
  selector: 'app-live-battles',
  imports: [
    CountdownBarComponent,
    StatusBadgeComponent,
    YieldValueComponent,
    SymbolLogoComponent,
    TagComponent,
    MoneyPipe,
  ],
  templateUrl: './live-battles.html',
})
export class LiveBattles {
  readonly sessions = input.required<LiveSessionView[] | null>();
  readonly joinPending = input<number | null>(null);
  readonly leavePending = input<number | null>(null);
  /** Battle ids the signed-in user is seated in — drives whether "Leave" is offered. */
  readonly joinedSessionIds = input<number[]>([]);

  readonly join = output<LiveSessionView>();
  readonly leave = output<LiveSessionView>();
  readonly open = output<LiveSessionView>();

  protected readonly intervalLabels = SESSION_INTERVAL_LABEL;

  private readonly expanded = signal<Set<number>>(new Set());

  protected isExpanded(id: number): boolean {
    return this.expanded().has(id);
  }

  protected toggle(id: number): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  /** A seat is only offered while the battle hasn't started and there's room in it. */
  protected canJoin(session: LiveSessionView): boolean {
    return (
      session.status === 'PENDING' &&
      session.participantCount < session.maxParticipants &&
      !this.isJoined(session)
    );
  }

  protected isJoined(session: LiveSessionView): boolean {
    return this.joinedSessionIds().includes(session.id);
  }

  protected vacancy(session: LiveSessionView): number {
    return Math.max(0, session.maxParticipants - session.participantCount);
  }

  protected leader(session: LiveSessionView) {
    return session.participants.length > 0 ? session.participants[0] : null;
  }

  /** Only a few symbol tags fit on a collapsed row; the rest become a "+N" chip. */
  protected visibleSymbols(session: LiveSessionView) {
    return session.symbols.slice(0, 4);
  }

  protected hiddenSymbolCount(session: LiveSessionView): number {
    return Math.max(0, session.symbols.length - 4);
  }
}
