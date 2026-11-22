import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ExecutionStatus } from '../../../core/models/execution.models';
import { elapsedSince, formatDuration } from '../../utils/duration';

/**
 * Duration of an execution. Completed runs show the backend's `durationMs`; running runs show the
 * time elapsed since start, recalculated on each data refresh.
 */
@Component({
  selector: 'app-duration',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="duration" [class.live]="isLive" [matTooltip]="tooltip" [matTooltipDisabled]="!tooltip">
      <mat-icon *ngIf="isLive" aria-hidden="true">timelapse</mat-icon>{{ text }}
    </span>
  `,
  styles: [
    `
      @use 'tokens' as t;
      .duration { display: inline-flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .live { color: t.$info; }
      .mat-icon { font-size: 14px; width: 14px; height: 14px; }
    `,
  ],
})
export class DurationComponent {
  @Input() ms: number | null | undefined = null;
  @Input() status: ExecutionStatus | null = null;
  @Input() startTime: string | null = null;

  get isLive(): boolean {
    return (this.ms === null || this.ms === undefined) && this.status === 'RUNNING' && !!this.startTime;
  }

  get text(): string {
    if (this.isLive) {
      return formatDuration(elapsedSince(this.startTime));
    }
    return formatDuration(this.ms);
  }

  get tooltip(): string {
    if (this.isLive) {
      return 'Still running: time elapsed since start';
    }
    return this.ms !== null && this.ms !== undefined ? `${this.ms.toLocaleString()} ms` : '';
  }
}
