import { Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { MarketPulseView, TrendingSymbolView } from '../../../core/models/discovery.model';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { SparkChartComponent } from '../../../shared/ui/spark-chart/spark-chart';
import { SymbolLogoComponent } from '../../../shared/ui/symbol-logo/symbol-logo';
import { YieldValueComponent } from '../../../shared/ui/yield-value/yield-value';

/**
 * Horizontally slidable strip of live symbol charts.
 *
 * <p>Scrolling is native (CSS scroll-snap + overflow), so trackpad, touch swipe and keyboard all
 * work without a gesture library; the arrows just drive `scrollBy`. The arrow disabled-state is
 * derived from scroll position on every scroll event rather than from an index, which keeps it
 * correct when the user drags the strip themselves.
 *
 * <p>Snapping is `proximity`, not `mandatory`. Under `mandatory` the browser must land on a snap
 * point, so when the strip only just overflows — a few tiles, or a wide viewport — there is no
 * reachable snap point past the first and the strip refuses to scroll at all. `proximity` snaps
 * when you're already close and otherwise leaves scrolling alone.
 */
@Component({
  selector: 'app-market-carousel',
  imports: [SparkChartComponent, SymbolLogoComponent, YieldValueComponent, MoneyPipe],
  templateUrl: './market-carousel.html',
})
export class MarketCarousel {
  readonly pulse = input.required<MarketPulseView | null>();

  /**
   * A signal query, not `@ViewChild`: the track sits inside nested `@if` blocks, and a decorator
   * query resolves once against a view that doesn't contain it yet — leaving the arrows silently
   * doing nothing. Signal queries re-evaluate when the conditional view appears.
   */
  private readonly track = viewChild<ElementRef<HTMLDivElement>>('track');

  protected readonly atStart = signal(true);
  protected readonly atEnd = signal(false);

  protected readonly symbols = computed(() => this.pulse()?.symbols ?? []);

  /** True when any tile's series is generated rather than real history. */
  protected readonly hasSynthetic = computed(() => this.symbols().some((s) => s.synthetic));

  protected trendOf(symbol: TrendingSymbolView): 'up' | 'down' | 'neutral' {
    if (symbol.changePct > 0) return 'up';
    if (symbol.changePct < 0) return 'down';
    return 'neutral';
  }

  protected scroll(direction: -1 | 1): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    // One "page" is the visible width minus a card's worth of overlap, so the user keeps a visual
    // anchor between pages instead of the strip jumping to an entirely new set of tiles.
    const amount = direction * Math.max(240, el.clientWidth - 260);
    el.scrollBy({ left: amount, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  protected onScroll(): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    this.atStart.set(el.scrollLeft <= 4);
    this.atEnd.set(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }
}

/**
 * Animated scrolling is motion the user may have asked the OS to suppress. The global
 * reduced-motion rule in `styles.css` can shorten transitions but can't reach a programmatic
 * `behavior: 'smooth'`, so it's checked here.
 */
function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
