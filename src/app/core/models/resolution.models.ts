/**
 * Mirrors the backend DTOs of the resolution API (com.hackathon.agent.resolution.api.ResolutionDtos). A resolution
 * tracks the work on a failure; it is neither the Tekton execution status nor the status of an AI investigation.
 * TaskRun resolutions are changed by people; a PipelineRun resolution is derived from its failed TaskRuns.
 */
import { ExecutionStatus } from './execution.models';
import { ResponsibleTeam } from './agent-investigation.models';

export type ResolutionStatus = 'OPEN' | 'INVESTIGATING' | 'FIX_IN_PROGRESS' | 'RESOLVED' | 'REOPENED';
export type ResolutionTargetKind = 'TASK_RUN' | 'PIPELINE_RUN';

export const RESOLUTION_STATUSES: readonly ResolutionStatus[] = ['OPEN', 'INVESTIGATING', 'FIX_IN_PROGRESS', 'RESOLVED', 'REOPENED'];

export interface TaskRunResolutionItem {
  /** Null when the TaskRun is no longer stored; its record is kept. */
  readonly taskRunId: number | null;
  readonly taskRunName: string;
  readonly taskName: string | null;
  readonly executionStatus: ExecutionStatus | null;
  readonly status: ResolutionStatus;
  readonly tracked: boolean;
  readonly assignedTeam: ResponsibleTeam | null;
  readonly summary: string | null;
  readonly updatedAt: string | null;
  readonly resolvedAt: string | null;
}

export interface PipelineTaskRunSummary {
  readonly failedTaskRuns: number;
  readonly resolvedTaskRuns: number;
  readonly unresolvedTaskRuns: number;
  readonly byStatus: Readonly<Partial<Record<ResolutionStatus, number>>>;
  readonly items: readonly TaskRunResolutionItem[];
}

export interface Resolution {
  readonly targetType: ResolutionTargetKind;
  readonly taskRunId: number | null;
  readonly pipelineRunId: number | null;
  readonly targetName: string;
  readonly namespace: string;
  readonly executionStatus: ExecutionStatus | null;
  /** False while no one has changed the resolution (for a PipelineRun: of any failed TaskRun); a failed TaskRun is then OPEN. */
  readonly tracked: boolean;
  /** Null when there is nothing to resolve: a TaskRun that has not failed, a PipelineRun without failed TaskRuns. */
  readonly status: ResolutionStatus | null;
  /** Empty for a PipelineRun: its resolution is read-only. */
  readonly nextStatuses: readonly ResolutionStatus[];
  readonly assignedTeam: ResponsibleTeam | null;
  readonly assignedPerson: string | null;
  readonly summary: string | null;
  readonly notes: string | null;
  readonly updatedBy: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly resolvedAt: string | null;
  /** Sent back with the next update; null while not tracked. */
  readonly version: number | null;
  /** Only for PipelineRuns. */
  readonly taskRuns: PipelineTaskRunSummary | null;
}

/** Fields left out keep their value; an empty string clears a text field. */
export interface ResolutionUpdate {
  readonly status: ResolutionStatus;
  readonly assignedTeam?: ResponsibleTeam | '' | null;
  readonly assignedPerson?: string | null;
  readonly summary?: string | null;
  readonly notes?: string | null;
  /** Reason for the change, kept in the history. */
  readonly comment?: string | null;
  readonly changedBy?: string | null;
}

export interface ResolutionUpdateRequest extends ResolutionUpdate {
  readonly version: number | null;
}

export interface ResolutionHistoryEntry {
  readonly id: number;
  /** The TaskRun the change belongs to; null if it is no longer stored. */
  readonly taskRunId: number | null;
  readonly taskRunName: string;
  /** Null for the change that started tracking. */
  readonly previousStatus: ResolutionStatus | null;
  readonly newStatus: ResolutionStatus;
  readonly assignedTeam: ResponsibleTeam | null;
  readonly assignedPerson: string | null;
  readonly summary: string | null;
  readonly note: string | null;
  readonly changedBy: string | null;
  readonly changedAt: string;
}

export interface ResolutionSummary {
  readonly runId: number;
  readonly tracked: boolean;
  /** Null when there is nothing to resolve. */
  readonly status: ResolutionStatus | null;
  readonly assignedTeam: ResponsibleTeam | null;
  readonly updatedAt: string | null;
  /** Only for PipelineRuns: its failed TaskRuns and how many of them are resolved. */
  readonly failedTaskRuns?: number | null;
  readonly resolvedTaskRuns?: number | null;
}
