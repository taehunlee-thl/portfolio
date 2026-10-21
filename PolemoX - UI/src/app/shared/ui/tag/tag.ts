import { Component, computed, input } from '@angular/core';

export type TagTone = 'neutral' | 'brass' | 'gain' | 'loss' | 'info';

const TONES: Record<TagTone, string> = {
  neutral: 'border-line bg-panel-raised text-fg-muted',
  brass: 'border-brass/35 bg-brass/10 text-brass',
  gain: 'border-gain/35 bg-gain/10 text-gain',
  loss: 'border-loss/35 bg-loss/10 text-loss',
  info: 'border-[#5a9fd4]/35 bg-[#5a9fd4]/10 text-[#5a9fd4]',
};

/**
 * A small labelled chip. Optional `label` renders as a dimmed prefix so a tag can carry both what
 * a value *is* and what it *says* ("STAKE · $100,000") without needing a separate caption element.
 */
@Component({
  selector: 'app-tag',
  template: `
    <span
      class="inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] leading-tight"
      [class]="toneClass()"
    >
      @if (label()) {
        <span class="uppercase tracking-wide opacity-60">{{ label() }}</span>
      }
      <span [class.num]="numeric()">
        <ng-content />
      </span>
    </span>
  `,
})
export class TagComponent {
  readonly tone = input<TagTone>('neutral');
  readonly label = input<string | null>(null);
  /** Renders the value in the tabular mono face — use for anything numeric. */
  readonly numeric = input(false);

  protected readonly toneClass = computed(() => TONES[this.tone()]);
}
