import { Component, computed, input, signal } from '@angular/core';

/** Deterministic tint for a ticker's monogram, so the same symbol always looks the same. */
const MONOGRAM_TINTS = [
  'bg-brass/15 text-brass',
  'bg-[#5a9fd4]/15 text-[#5a9fd4]',
  'bg-[#9b7fc4]/15 text-[#9b7fc4]',
  'bg-[#4fb49a]/15 text-[#4fb49a]',
  'bg-[#d4885a]/15 text-[#d4885a]',
  'bg-[#c45a7c]/15 text-[#c45a7c]',
];

/**
 * A company's logo, falling back to a tinted ticker monogram.
 *
 * <p>Two fallbacks, not one: symbols with no stored logo never attempt a request, and symbols
 * whose stored URL 404s swap to the monogram on error. Without the second, a dead CDN link leaves
 * a broken-image glyph in the middle of the UI.
 */
@Component({
  selector: 'app-symbol-logo',
  template: `
    @if (logoUrl() && !failed()) {
      <img
        [src]="logoUrl()"
        [alt]="symbol()"
        [width]="size()"
        [height]="size()"
        loading="lazy"
        (error)="failed.set(true)"
        class="shrink-0 rounded-md bg-white/95 object-contain p-0.5"
        [style.width.px]="size()"
        [style.height.px]="size()"
      />
    } @else {
      <span
        class="inline-flex shrink-0 items-center justify-center rounded-md font-medium"
        [class]="tint()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.font-size.px]="monogramFontSize()"
        [attr.aria-label]="symbol()"
      >
        {{ monogram() }}
      </span>
    }
  `,
})
export class SymbolLogoComponent {
  readonly symbol = input.required<string>();
  readonly logoUrl = input<string | null>(null);
  readonly size = input(28);

  protected readonly failed = signal(false);

  protected readonly monogram = computed(() => this.symbol().slice(0, 2).toUpperCase());

  protected readonly monogramFontSize = computed(() => Math.max(9, Math.round(this.size() * 0.38)));

  protected readonly tint = computed(() => {
    const seed = [...this.symbol()].reduce((sum, c) => sum + c.charCodeAt(0), 0);
    return MONOGRAM_TINTS[seed % MONOGRAM_TINTS.length];
  });
}
