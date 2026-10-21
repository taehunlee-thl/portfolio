import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { SessionTradeView } from '../../../core/models/discovery.model';
import { DiscoveryService } from '../../../core/services/discovery.service';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { QtyPipe } from '../../../shared/pipes/qty.pipe';
import { SymbolLogoComponent } from '../../../shared/ui/symbol-logo/symbol-logo';

/** How often the tape re-polls while a battle is live. */
const POLL_MS = 10_000;

/**
 * The live tape for a battle: who bought or sold what, at what price, when.
 *
 * <p>Polls rather than using the WebSocket, because the existing socket carries leaderboard
 * snapshots rather than individual fills and spectators here are anonymous — no token, so no STOMP
 * session. A 10s poll on a cheap indexed read is the right trade for a spectator view.
 *
 * <p>New fills are marked so the UI can highlight them briefly: a tape where rows appear silently
 * is hard to read, and the flash is the only cue that something just happened.
 */
@Component({
  selector: 'app-trade-tape',
  imports: [SymbolLogoComponent, MoneyPipe, QtyPipe, DatePipe],
  templateUrl: './trade-tape.html',
})
export class TradeTape implements OnInit {
  readonly sessionId = input.required<number>();
  /** Stops polling once the battle is over — the tape can no longer change. */
  readonly live = input(true);

  private readonly discovery = inject(DiscoveryService);

  protected readonly trades = signal<SessionTradeView[] | null>(null);
  protected readonly failed = signal(false);
  private readonly seen = signal<Set<number>>(new Set());

  protected readonly isEmpty = computed(() => (this.trades()?.length ?? 0) === 0);

  constructor() {
    const timer = setInterval(() => {
      if (this.live()) {
        this.load();
      }
    }, POLL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    this.load();
  }

  /** True for fills that arrived after this component first rendered. */
  protected isNew(trade: SessionTradeView): boolean {
    return !this.seen().has(trade.id);
  }

  private load(): void {
    this.discovery.sessionTape(this.sessionId(), 40).subscribe({
      next: (trades) => {
        const first = this.trades() === null;
        this.trades.set(trades);
        this.failed.set(false);
        if (first) {
          // Everything present on the first load is history, not news — don't flash all of it.
          this.seen.set(new Set(trades.map((t) => t.id)));
        } else {
          // Let the newest batch flash once, then fold it into the seen set.
          setTimeout(() => this.seen.update((s) => new Set([...s, ...trades.map((t) => t.id)])), 1500);
        }
      },
      error: () => {
        this.failed.set(true);
        this.trades.update((current) => current ?? []);
      },
    });
  }
}
