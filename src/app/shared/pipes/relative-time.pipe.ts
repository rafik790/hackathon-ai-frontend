import { Pipe, PipeTransform } from '@angular/core';

/**
 * `{{ timestamp | relativeTime }}` → "5 min ago". Pure: it re-evaluates when the input changes,
 * which happens on every data refresh.
 */
@Pipe({ name: 'relativeTime', standalone: false })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, now: number = Date.now()): string {
    if (value === null || value === undefined) {
      return '—';
    }
    const time = value instanceof Date ? value.getTime() : Date.parse(value);
    if (Number.isNaN(time)) {
      return '—';
    }
    const seconds = Math.round((now - time) / 1000);
    if (seconds < 0) {
      return 'just now';
    }
    if (seconds < 45) return 'just now';
    if (seconds < 90) return '1 min ago';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
}
