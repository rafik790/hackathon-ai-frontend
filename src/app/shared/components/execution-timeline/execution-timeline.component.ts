import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { TaskRun } from '../../../core/models/execution.models';
import { firstFailedTask } from '../../pipes/first-failed-task.pipe';
import { statusPresentation, StatusTone } from '../../utils/status';

export interface TimelineStep {
  readonly task: TaskRun;
  readonly tone: StatusTone;
  readonly icon: string;
  /** Bar offset and width as a percentage of the whole execution window; null when not started. */
  readonly offsetPct: number | null;
  readonly widthPct: number | null;
  readonly offsetMs: number | null;
  readonly isFailureOrigin: boolean;
}

/**
 * Step list plus Gantt bars for the TaskRuns of a PipelineRun, ordered by start time (as returned
 * by the backend). The earliest failed TaskRun is marked as the failure origin.
 */
@Component({
  selector: 'app-execution-timeline',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './execution-timeline.component.html',
  styleUrls: ['./execution-timeline.component.scss'],
})
export class ExecutionTimelineComponent implements OnChanges {
  @Input({ required: true }) tasks: readonly TaskRun[] = [];
  /** Optional window bounds; default to the earliest task start and the latest task end. */
  @Input() windowStart: string | null = null;
  @Input() windowEnd: string | null = null;
  @Output() readonly taskSelect = new EventEmitter<TaskRun>();

  steps: readonly TimelineStep[] = [];
  windowMs = 0;

  ngOnChanges(): void {
    this.steps = this.buildSteps();
  }

  private buildSteps(): TimelineStep[] {
    const now = Date.now();
    const starts = this.tasks.map((t) => parse(t.startTime)).filter((v): v is number => v !== null);
    const ends = this.tasks
      .map((t) => parse(t.completionTime) ?? (t.status === 'RUNNING' && t.startTime ? now : parse(t.startTime)))
      .filter((v): v is number => v !== null);

    const start = parse(this.windowStart) ?? (starts.length ? Math.min(...starts) : null);
    const end = Math.max(parse(this.windowEnd) ?? 0, ends.length ? Math.max(...ends) : 0);
    this.windowMs = start !== null && end > start ? end - start : 0;

    const firstFailure = firstFailedTask(this.tasks);

    return this.tasks.map((task) => {
      const presentation = statusPresentation(task.status);
      const taskStart = parse(task.startTime);
      const taskEnd = parse(task.completionTime) ?? (task.status === 'RUNNING' ? now : taskStart);
      let offsetPct: number | null = null;
      let widthPct: number | null = null;
      if (start !== null && taskStart !== null && this.windowMs > 0) {
        offsetPct = clamp(((taskStart - start) / this.windowMs) * 100);
        widthPct = Math.max(0.8, clamp((((taskEnd ?? taskStart) - taskStart) / this.windowMs) * 100, 0, 100 - offsetPct));
      }
      return {
        task,
        tone: presentation.tone,
        icon: presentation.icon,
        offsetPct,
        widthPct,
        offsetMs: start !== null && taskStart !== null ? taskStart - start : null,
        isFailureOrigin: task === firstFailure,
      };
    });
  }

  trackById(_: number, step: TimelineStep): number {
    return step.task.id;
  }
}

function parse(iso: string | null | undefined): number | null {
  if (!iso) {
    return null;
  }
  const value = Date.parse(iso);
  return Number.isNaN(value) ? null : value;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}
