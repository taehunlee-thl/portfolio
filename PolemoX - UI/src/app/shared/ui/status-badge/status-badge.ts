import { Component, computed, input } from '@angular/core';
import { SessionStatus } from '../../../core/models/session.model';

const CONFIG: Record<SessionStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pending', classes: 'text-brass border-brass/40 bg-brass/10' },
  ACTIVE: { label: 'Active', classes: 'text-gain border-gain/40 bg-gain/10' },
  COMPLETED: { label: 'Completed', classes: 'text-fg-muted border-line-strong bg-panel-raised' },
  CANCELLED: { label: 'Cancelled', classes: 'text-loss border-loss/40 bg-loss/10' },
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide"
      [class]="config().classes"
    >
      @if (status() === 'ACTIVE') {
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-gain"></span>
      }
      {{ config().label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<SessionStatus>();

  protected readonly config = computed(() => CONFIG[this.status()]);
}
