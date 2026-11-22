import { TimeRangePreset } from '../../../core/models/dashboard.models';
import { PipelineRun, TaskRun } from '../../../core/models/execution.models';
import { BarItem } from '../../../shared/charts/bar-list-chart.component';

export interface FailureFilters {
  readonly range: TimeRangePreset;
  readonly namespace: string | null;
}

/** Failures sampled from the list endpoints (most recent first, at most 100 of each kind). */
export interface FailureSample {
  readonly pipelineRuns: readonly PipelineRun[];
  readonly pipelineRunTotal: number;
  readonly taskRuns: readonly TaskRun[];
  readonly taskRunTotal: number;
}

export interface FailureBreakdown {
  readonly byPipeline: readonly BarItem[];
  readonly byTask: readonly BarItem[];
  readonly byReason: readonly BarItem[];
  /** True when more failures exist than were sampled. */
  readonly truncated: boolean;
  readonly sampledPipelineRuns: number;
  readonly sampledTaskRuns: number;
}
