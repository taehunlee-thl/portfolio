import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import {
  ColorType,
  ISeriesApi,
  LineSeries,
  UTCTimestamp,
  createChart,
} from 'lightweight-charts';
import { AccountView, PositionView, StockInfo, TradeSide, TradeView } from '../../../core/models/trading.model';
import { problemMessage } from '../../../core/models/problem-detail.model';
import { PriceService } from '../../../core/services/price.service';
import { TradingService } from '../../../core/services/trading.service';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { QtyPipe } from '../../../shared/pipes/qty.pipe';

/**
 * The order-execution panel for one participant's session account: symbol search, a live price
 * line (polled from the moment the terminal opens — the backend only exposes the latest quote, so
 * there is no real intraday history to chart, and this deliberately does not fabricate any),
 * the order ticket, current positions, and trade history.
 */
@Component({
  selector: 'app-trading-terminal',
  imports: [FormsModule, MoneyPipe, QtyPipe],
  templateUrl: './trading-terminal.html',
})
export class TradingTerminal implements AfterViewInit, OnDestroy {
  readonly accountId = input.required<number>();
  readonly disabled = input(false);

  @ViewChild('chartContainer') private chartContainer?: ElementRef<HTMLDivElement>;

  protected readonly account = signal<AccountView | null>(null);
  protected readonly positions = signal<PositionView[]>([]);
  protected readonly trades = signal<TradeView[]>([]);

  protected readonly symbol = signal('AAPL');
  protected readonly searchTerm = signal('');
  protected readonly searchResults = signal<StockInfo[]>([]);
  protected readonly currentPrice = signal<number | null>(null);

  protected readonly side = signal<TradeSide>('BUY');
  protected readonly quantity = signal<number | null>(1);
  protected readonly placingOrder = signal(false);
  protected readonly orderMessage = signal<string | null>(null);

  private readonly search$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  private chart?: ReturnType<typeof createChart>;
  private series?: ISeriesApi<'Line'>;
  private priceHistory: { time: UTCTimestamp; value: number }[] = [];
  private priceTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly priceService: PriceService,
    private readonly tradingService: TradingService,
  ) {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.priceService.searchStocks(term)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => this.searchResults.set(page.results));

    effect(() => {
      const id = this.accountId();
      this.refreshAccountData(id);
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.trackSymbol(this.symbol());
  }

  ngOnDestroy(): void {
    this.chart?.remove();
    clearInterval(this.priceTimer);
  }

  protected onSearchInput(term: string): void {
    this.searchTerm.set(term);
    if (term.trim().length >= 1) {
      this.search$.next(term);
    } else {
      this.searchResults.set([]);
    }
  }

  protected selectSymbol(stock: StockInfo): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.symbol.set(stock.ticker);
    this.trackSymbol(stock.ticker);
  }

  protected setSide(side: TradeSide): void {
    this.side.set(side);
  }

  protected submitOrder(): void {
    const qty = this.quantity();
    if (!qty || qty <= 0 || this.placingOrder() || this.disabled()) return;

    this.placingOrder.set(true);
    this.orderMessage.set(null);
    this.tradingService
      .placeOrder(this.accountId(), { symbol: this.symbol(), side: this.side(), quantity: qty })
      .subscribe({
        next: (trade) => {
          this.placingOrder.set(false);
          this.orderMessage.set(`${trade.side} ${trade.quantity} ${trade.symbol} @ ${trade.price.toFixed(2)}`);
          this.refreshAccountData(this.accountId());
        },
        error: (err) => {
          this.placingOrder.set(false);
          this.orderMessage.set(problemMessage(err, 'Order rejected.'));
        },
      });
  }

  protected positionQuantity(symbol: string): number {
    return this.positions().find((p) => p.symbol === symbol)?.quantity ?? 0;
  }

  private trackSymbol(symbol: string): void {
    this.priceHistory = [];
    this.series?.setData([]);
    clearInterval(this.priceTimer);
    this.pollPrice(symbol);
    this.priceTimer = setInterval(() => this.pollPrice(symbol), 5000);
  }

  private pollPrice(symbol: string): void {
    this.priceService.getPrice(symbol).subscribe({
      next: (quote) => {
        if (symbol !== this.symbol()) return; // stale response for a symbol we've since left
        this.currentPrice.set(quote.price);
        const point = { time: Math.floor(Date.now() / 1000) as UTCTimestamp, value: quote.price };
        const last = this.priceHistory.at(-1);
        if (!last || point.time > last.time) {
          this.priceHistory.push(point);
          this.series?.update(point);
        }
      },
    });
  }

  private initChart(): void {
    const container = this.chartContainer?.nativeElement;
    if (!container) return;

    this.chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#868d97',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1b2026' },
        horzLines: { color: '#1b2026' },
      },
      rightPriceScale: { borderColor: '#262b31' },
      timeScale: { borderColor: '#262b31', timeVisible: true, secondsVisible: true },
      crosshair: { mode: 0 },
    });

    this.series = this.chart.addSeries(LineSeries, {
      color: '#c6a356',
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
    });
  }

  private refreshAccountData(accountId: number): void {
    this.tradingService.getAccount(accountId).subscribe({ next: (a) => this.account.set(a) });
    this.tradingService.positions(accountId).subscribe({ next: (p) => this.positions.set(p) });
    this.tradingService.trades(accountId).subscribe({ next: (t) => this.trades.set(t) });
  }
}
