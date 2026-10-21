import { Pipe, PipeTransform } from '@angular/core';

/** Share quantities come off the wire at 8-decimal scale (e.g. 10.00000000) — trim the noise. */
@Pipe({ name: 'qty' })
export class QtyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
}
