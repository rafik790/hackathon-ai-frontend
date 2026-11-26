import { TimeRangePreset } from '../../../core/models/dashboard.models';
import { TaskRun } from '../../../core/models/execution.models';
import { FailureAnalysisSummary } from '../../../core/models/failure-analysis.models';

export interface FailureFilters {
  readonly range: TimeRangePreset;
  readonly namespace: string | null;
}

/** Failed TaskRuns sampled from the list endpoint (most recent first, at most 100). */
export interface FailureSample {
  readonly taskRuns: readonly TaskRun[];
  readonly taskRunTotal: number;
}

export interface CountItem {
  readonly label: string;
  readonly value: number;
}

export interface FailureBreakdown {
  readonly byTask: readonly CountItem[];
  readonly byReason: readonly CountItem[];
  /** True when more failures exist than were sampled. */
  readonly truncated: boolean;
  readonly sampledTaskRuns: number;
}

export interface RecentAnalyses {
  readonly items: readonly FailureAnalysisSummary[];
  /** All analyses, of every namespace and time. */
  readonly total: number;
}
