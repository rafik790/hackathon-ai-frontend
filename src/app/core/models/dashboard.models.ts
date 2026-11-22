/** Mirrors com.hackathon.agent.dto.DashboardSummaryResponse / TrendResponse. */

/** Presets accepted by the `range` parameter (com.hackathon.agent.enums.TimeRangePreset). */
export type TimeRangePreset = '24h' | '7d' | '30d';

export const TIME_RANGE_PRESETS: readonly { readonly value: TimeRangePreset; readonly label: string }[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

/** Narrows an untrusted value (e.g. a query parameter) to a preset. */
export function parseTimeRangePreset(value: string | null | undefined): TimeRangePreset | null {
  return value === '24h' || value === '7d' || value === '30d' ? value : null;
}

export type TrendGranularity = 'HOUR' | 'DAY';

export interface DashboardQuery {
  readonly range?: TimeRangePreset | null;
  readonly namespace?: string | null;
  readonly pipelineName?: string | null;
}

export interface TrendQuery extends DashboardQuery {
  readonly granularity?: TrendGranularity | null;
}

/**
 * Reliability summary. Rates are percentages over completed executions (succeeded + failed)
 * and are 0 when nothing completed. Durations are null when no execution completed.
 */
export interface DashboardSummary {
  readonly from: string;
  readonly to: string;
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly runningExecutions: number;
  readonly unknownExecutions: number;
  readonly successRate: number;
  readonly failureRate: number;
  readonly averageDurationMs: number | null;
  readonly p95DurationMs: number | null;
  readonly totalTaskRuns: number;
  readonly failedTaskRuns: number;
  readonly taskFailureRate: number;
}

export interface TrendPoint {
  readonly bucketStart: string;
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly running: number;
  readonly unknown: number;
  readonly successRate: number;
  readonly averageDurationMs: number | null;
}

/** PipelineRun time series; buckets are UTC aligned and contiguous. */
export interface TrendResponse {
  readonly from: string;
  readonly to: string;
  readonly granularity: TrendGranularity;
  readonly points: readonly TrendPoint[];
}
