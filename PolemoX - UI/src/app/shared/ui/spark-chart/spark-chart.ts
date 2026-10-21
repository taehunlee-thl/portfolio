import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core';
import { AreaSeries, ColorType, IChartApi, ISeriesApi, UTCTimestamp, createChart } from 'lightweight-charts';

/**
 * A compact area chart for a plain `number[]` series.
 *
 * <p>Axes and crosshair are off by default: the backend sends prices without timestamps (the
 * payload is a sparkline, not a time-accurate series), so drawing a time axis would invent
 * precision that isn't in the data. Timestamps are reconstructed only to satisfy the charting
 * library's ordering requirement.
 */
@Component({
  selector: 'app-spark-chart',
  template: `<div #host [style.height.px]="height()" class="w-full"></div>`,
})
export class SparkChartComponent implements AfterViewInit, OnDestroy {
  readonly data = input.required<number[]>();
  readonly height = input(64);
  /** Drives line/fill colour; defaults to brass when not a clear gain or loss. */
  readonly trend = input<'up' | 'down' | 'neutral'>('neutral');

  @ViewChild('host', { static: true }) private host!: ElementRef<HTMLDivElement>;

  private chart?: IChartApi;
  private series?: ISeriesApi<'Area'>;

  constructor() {
    // Runs on every data/trend change, including before the view exists — render() no-ops until
    // ngAfterViewInit has built the chart, then repaints.
    effect(() => {
      const points = this.data();
      const trend = this.trend();
      this.render(points, trend);
    });
  }

  ngAfterViewInit(): void {
    this.chart = createChart(this.host.nativeElement, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false, fixLeftEdge: true, fixRightEdge: true },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });
    this.render(this.data(), this.trend());
  }

  ngOnDestroy(): void {
    this.chart?.remove();
  }

  private render(points: number[], trend: 'up' | 'down' | 'neutral'): void {
    if (!this.chart || points.length === 0) return;

    const colors = {
      up: { line: '#35c47c', top: 'rgba(53, 196, 124, 0.28)' },
      down: { line: '#e2554f', top: 'rgba(226, 85, 79, 0.28)' },
      neutral: { line: '#c6a356', top: 'rgba(198, 163, 86, 0.28)' },
    }[trend];

    this.series ??= this.chart.addSeries(AreaSeries, {
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    this.series.applyOptions({
      lineColor: colors.line,
      topColor: colors.top,
      bottomColor: 'rgba(0, 0, 0, 0)',
    });

    // Evenly spaced synthetic timestamps, 5 minutes apart, ending now — ordering only; never shown.
    const stepSeconds = 300;
    const endSeconds = Math.floor(Date.now() / 1000);
    this.series.setData(
      points.map((value, index) => ({
        time: (endSeconds - (points.length - 1 - index) * stepSeconds) as UTCTimestamp,
        value,
      })),
    );
    this.chart.timeScale().fitContent();
  }
}
