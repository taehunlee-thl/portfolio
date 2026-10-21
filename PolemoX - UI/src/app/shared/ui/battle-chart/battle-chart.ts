import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import {
  ColorType,
  IChartApi,
  ISeriesApi,
  LineSeries,
  UTCTimestamp,
  createChart,
} from 'lightweight-charts';
import { EquitySeriesView } from '../../../core/models/discovery.model';

/**
 * Line colours for traders, in assignment order. Deliberately not the gain/loss red-green pair:
 * here the lines distinguish *people*, and colouring them by direction would collide with the
 * red/green that means profit and loss everywhere else in the app.
 */
const SERIES_COLORS = ['#c6a356', '#5a9fd4', '#9b7fc4', '#4fb49a', '#d4885a', '#c45a7c'];

/**
 * A battle's performance chart: one line per trader, plotting return against the starting balance.
 *
 * <p>Rebuilds its series whenever the data changes rather than diffing — a battle has a handful of
 * traders and swapping the whole set is both simpler and cheap at this size.
 */
@Component({
  selector: 'app-battle-chart',
  template: `<div #host [style.height.px]="height()" class="w-full"></div>`,
})
export class BattleChartComponent implements AfterViewInit, OnDestroy {
  readonly timeline = input.required<string[]>();
  readonly series = input.required<EquitySeriesView[]>();
  readonly height = input(220);

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');

  private chart?: IChartApi;
  private lines: ISeriesApi<'Line'>[] = [];

  constructor() {
    effect(() => {
      const timeline = this.timeline();
      const series = this.series();
      this.render(timeline, series);
    });
  }

  ngAfterViewInit(): void {
    this.chart = createChart(this.host().nativeElement, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#868d97',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#1b2026' },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.15, bottom: 0.15 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      handleScroll: false,
      handleScale: false,
    });
    this.render(this.timeline(), this.series());
  }

  ngOnDestroy(): void {
    this.chart?.remove();
  }

  private render(timeline: string[], series: EquitySeriesView[]): void {
    if (!this.chart) return;

    for (const line of this.lines) {
      this.chart.removeSeries(line);
    }
    this.lines = [];

    if (timeline.length === 0 || series.length === 0) return;

    const times = timeline.map((iso) => Math.floor(new Date(iso).getTime() / 1000) as UTCTimestamp);

    series.forEach((trader, index) => {
      const line = this.chart!.addSeries(LineSeries, {
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: true,
        priceFormat: { type: 'percent', precision: 2, minMove: 0.01 },
      });
      line.setData(
        trader.points.map((value, i) => ({ time: times[i], value })).filter((p) => p.time !== undefined),
      );
      this.lines.push(line);
    });

    this.chart.timeScale().fitContent();
  }
}
