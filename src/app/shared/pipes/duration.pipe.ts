import { Pipe, PipeTransform } from '@angular/core';
import { formatDuration } from '../utils/duration';

/** `{{ run.durationMs | duration }}` → "3m 15s" */
@Pipe({ name: 'duration', standalone: false })
export class DurationPipe implements PipeTransform {
  transform(ms: number | null | undefined): string {
    return formatDuration(ms);
  }
}
