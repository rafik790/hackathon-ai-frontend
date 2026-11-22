/**
 * Mirrors the backend DTOs in com.hackathon.agent.dto (PipelineRunResponse, TaskRunResponse, PageResponse).
 * All timestamps are ISO-8601 strings in UTC.
 */

/** Normalized status (com.hackathon.agent.enums.ExecutionStatus). */
export type ExecutionStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';

export const EXECUTION_STATUSES: readonly ExecutionStatus[] = ['RUNNING', 'SUCCEEDED', 'FAILED', 'UNKNOWN'];

export interface PipelineRun {
  readonly id: number;
  readonly pipelineRunUid: string;
  readonly pipelineRunName: string;
  readonly namespace: string;
  readonly pipelineName: string | null;
  readonly status: ExecutionStatus;
  readonly startTime: string | null;
  readonly completionTime: string | null;
  readonly durationMs: number | null;
  readonly failureReason: string | null;
  readonly failureMessage: string | null;
  readonly resourceCreatedAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface TaskRun {
  readonly id: number;
  readonly taskRunUid: string;
  readonly taskRunName: string;
  readonly namespace: string;
  readonly pipelineRunUid: string | null;
  readonly pipelineRunName: string | null;
  readonly pipelineName: string | null;
  readonly taskName: string | null;
  readonly status: ExecutionStatus;
  readonly startTime: string | null;
  readonly completionTime: string | null;
  readonly durationMs: number | null;
  readonly failureReason: string | null;
  readonly failureMessage: string | null;
  readonly resourceCreatedAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

/** Zero-based page of results (com.hackathon.agent.dto.PageResponse). */
export interface PageResponse<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly sort: string | null;
}

export type SortDirection = 'asc' | 'desc';

/** Sort properties accepted by both list endpoints (PipelineRunQueryService/TaskRunQueryService.SORTABLE). */
export type CommonSortField =
  | 'startTime'
  | 'completionTime'
  | 'durationMs'
  | 'status'
  | 'pipelineName'
  | 'namespace'
  | 'createdAt'
  | 'updatedAt'
  | 'id';

export type PipelineRunSortField = CommonSortField | 'pipelineRunName';
export type TaskRunSortField = CommonSortField | 'taskRunName' | 'taskName' | 'pipelineRunName';

export interface PageRequest<S extends string> {
  readonly page: number;
  /** Capped at 100 by the backend. */
  readonly size: number;
  readonly sort: S;
  readonly direction: SortDirection;
}

/** Filters of GET /api/v1/pipelines. String filters are exact matches. */
export interface PipelineRunFilter {
  readonly namespace?: string | null;
  readonly pipelineName?: string | null;
  readonly status?: ExecutionStatus | null;
  /** Start-time lower bound, inclusive (ISO-8601). */
  readonly from?: string | null;
  /** Start-time upper bound, exclusive (ISO-8601). */
  readonly to?: string | null;
}

/** Filters of GET /api/v1/tasks. String filters are exact matches. */
export interface TaskRunFilter extends PipelineRunFilter {
  readonly taskName?: string | null;
  readonly pipelineRunName?: string | null;
}

export const MAX_PAGE_SIZE = 100;
