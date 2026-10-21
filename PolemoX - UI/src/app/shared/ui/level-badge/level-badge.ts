import { Component, computed, input } from '@angular/core';

/**
 * Lv. N in a brass-ringed circle, with a thin arc showing progress toward the next level.
 * Level curve mirrors the backend's `LevelCalculator`: level = floor((xp/100)^(2/3)) + 1, so the
 * XP floor for the *current* level is `100 * (level - 1)^1.5` and the ceiling for the next is the
 * same formula one level up — reproduced here purely for the progress ring, never to decide
 * anything: the server is always the source of truth for level/xpTotal.
 */
@Component({
  selector: 'app-level-badge',
  template: `
    <div class="inline-flex items-center gap-2" [class.flex-row-reverse]="labelPosition() === 'left'">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 36 36" class="shrink-0 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-line)" stroke-width="2.5" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="var(--color-brass)"
          stroke-width="2.5"
          stroke-linecap="round"
          [attr.stroke-dasharray]="97.4"
          [attr.stroke-dashoffset]="97.4 * (1 - progress())"
        />
        <text
          x="18"
          y="19"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(90 18 18)"
          class="num"
          [attr.font-size]="size() > 40 ? 11 : 9"
          fill="var(--color-fg)"
        >
          {{ level() }}
        </text>
      </svg>
      @if (showLabel()) {
        <span class="text-xs text-fg-muted uppercase tracking-wide">Level {{ level() }}</span>
      }
    </div>
  `,
})
export class LevelBadgeComponent {
  readonly level = input.required<number>();
  readonly xpTotal = input<number>(0);
  readonly size = input(36);
  readonly showLabel = input(false);
  readonly labelPosition = input<'left' | 'right'>('right');

  protected readonly progress = computed(() => {
    const level = this.level();
    const xp = this.xpTotal();
    const floor = 100 * Math.pow(Math.max(level - 1, 0), 1.5);
    const ceiling = 100 * Math.pow(level, 1.5);
    if (ceiling <= floor) return 0;
    return Math.min(1, Math.max(0, (xp - floor) / (ceiling - floor)));
  });
}
