import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { SessionStatus } from '../../../core/models/session.model';

/**
 * The session clock, rendered as a ticker-tape rule: a row of tick marks with a brass fill that
 * drains as the battle runs, sitting under a live "Xh Ym left" readout. Every session — the
 * dashboard card, the lobby, the live trading view — shows time the same way, so this is the one
 * piece of chrome that shows up everywhere and ties the app together.
 */
@Component({
  selector: 'app-countdown-bar',
  template: `
    <div class="w-full">
      <div class="mb-1.5 flex items-baseline justify-between">
        <span class="text-[11px] uppercase tracking-wider text-fg-muted">{{ caption() }}</span>
        <span class="num text-xs text-fg">{{ readout() }}</span>
      </div>
      <div class="relative h-2 w-full overflow-hidden rounded-sm bg-line">
        <div
          class="h-full rounded-sm transition-[width] duration-1000 ease-linear"
          [class]="status() === 'CANCELLED' ? 'bg-fg-faint' : 'bg-brass'"
          [style.width.%]="fillPct()"
        ></div>
        <div class="pointer-events-none absolute inset-0 flex justify-between px-[2px]">
          @for (tick of ticks; track tick) {
            <span class="w-px bg-ink/40"></span>
          }
        </div>
      </div>
    </div>
  `,
})
export class CountdownBarComponent {
  readonly status = input.required<SessionStatus>();
  readonly startAt = input<string | null>(null);
  readonly endAt = input<string | null>(null);
  /** For PENDING sessions: when the creator asked it to start. */
  readonly requestedStartAt = input<string | null>(null);

  protected readonly ticks = Array.from({ length: 23 });

  private readonly now = signal(Date.now());

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected readonly fillPct = computed(() => {
    const status = this.status();
    if (status === 'COMPLETED') return 100;
    if (status === 'CANCELLED') return 100;
    if (status !== 'ACTIVE') return 0;

    const start = this.parse(this.startAt());
    const end = this.parse(this.endAt());
    if (start === null || end === null || end <= start) return 0;
    return Math.min(100, Math.max(0, ((this.now() - start) / (end - start)) * 100));
  });

  protected readonly caption = computed(() => {
    switch (this.status()) {
      case 'PENDING':
        return 'Starts';
      case 'ACTIVE':
        return 'Time remaining';
      case 'COMPLETED':
        return 'Battle';
      default:
        return 'Battle';
    }
  });

  protected readonly readout = computed(() => {
    switch (this.status()) {
      case 'PENDING': {
        const start = this.parse(this.requestedStartAt());
        if (start === null) return '—';
        const delta = start - this.now();
        return delta <= 0 ? 'starting soon' : `in ${formatDuration(delta)}`;
      }
      case 'ACTIVE': {
        const end = this.parse(this.endAt());
        if (end === null) return '—';
        const delta = end - this.now();
        return delta <= 0 ? 'ending soon' : `${formatDuration(delta)} left`;
      }
      case 'COMPLETED':
        return 'ended';
      default:
        return 'cancelled';
    }
  });

  private parse(value: string | null): number | null {
    if (!value) return null;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
  }
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
