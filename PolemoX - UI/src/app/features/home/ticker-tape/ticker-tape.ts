import { Component, computed, input } from '@angular/core';
import { TrendingSymbolView } from '../../../core/models/discovery.model';
import { SymbolLogoComponent } from '../../../shared/ui/symbol-logo/symbol-logo';

/**
 * A scrolling ticker strip across the top of the page.
 *
 * <p>The list is rendered twice inside one track: the marquee translates by exactly -50%, so the
 * second copy lands precisely where the first began and the loop has no visible seam. It pauses on
 * hover so a symbol can actually be read, and is disabled entirely under reduced-motion.
 */
@Component({
  selector: 'app-ticker-tape',
  imports: [SymbolLogoComponent],
  template: `
    @if (symbols().length > 0) {
      <div class="group relative overflow-hidden border-y border-line bg-panel/60" aria-hidden="true">
        <div class="flex w-max animate-marquee">
          @for (pass of passes; track pass) {
            <div class="flex shrink-0">
              <!-- Tracking by symbol alone is correct here: the two passes are siblings in
                   separate containers, so keys only have to be unique within each one. -->
              @for (symbol of symbols(); track symbol.symbol) {
                <span class="flex items-center gap-2 border-r border-line/60 px-4 py-2">
                  <app-symbol-logo [symbol]="symbol.symbol" [logoUrl]="symbol.logoUrl" [size]="16" />
                  <span class="num text-[11px] font-medium text-fg">{{ symbol.symbol }}</span>
                  <span class="num text-[11px] text-fg-muted">{{ symbol.price.toFixed(2) }}</span>
                  <span
                    class="num text-[11px]"
                    [class]="symbol.changePct > 0 ? 'text-gain' : symbol.changePct < 0 ? 'text-loss' : 'text-fg-faint'"
                  >
                    {{ symbol.changePct > 0 ? '▲' : symbol.changePct < 0 ? '▼' : '·' }}
                    {{ absChange(symbol.changePct) }}%
                  </span>
                </span>
              }
            </div>
          }
        </div>

        <!-- Fade the strip into the page background at both edges. -->
        <div class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-ink to-transparent"></div>
        <div class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ink to-transparent"></div>
      </div>
    }
  `,
})
export class TickerTape {
  readonly symbols = input.required<TrendingSymbolView[]>();

  /** Two identical passes; the marquee translates -50% so the loop is seamless. */
  protected readonly passes = [0, 1];

  protected absChange(value: number): string {
    return Math.abs(value).toFixed(2);
  }
}
