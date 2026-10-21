import { Component, computed, input } from '@angular/core';

/** A +/- signed percentage or currency amount, coloured gain/loss, always in the mono numeral face. */
@Component({
  selector: 'app-yield-value',
  template: `
    <span class="num" [class]="colorClass()">{{ formatted() }}</span>
  `,
})
export class YieldValueComponent {
  readonly value = input.required<number>();
  readonly suffix = input('%');
  readonly digits = input(2);

  protected readonly colorClass = computed(() => {
    if (this.value() > 0) return 'text-gain';
    if (this.value() < 0) return 'text-loss';
    return 'text-fg-muted';
  });

  protected readonly formatted = computed(() => {
    const v = this.value();
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(this.digits())}${this.suffix()}`;
  });
}
