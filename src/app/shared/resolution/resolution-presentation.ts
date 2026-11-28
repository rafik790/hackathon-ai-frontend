import { OwnershipConfidence, ResponsibleTeam } from '../../core/models/agent-investigation.models';
import { PipelineTaskRunSummary, ResolutionStatus } from '../../core/models/resolution.models';

export interface TeamPresentation {
  readonly label: string;
  readonly icon: string;
}

export const TEAMS: Readonly<Record<ResponsibleTeam, TeamPresentation>> = {
  DEVELOPER: { label: 'Developer', icon: 'code' },
  DEVOPS_PLATFORM: { label: 'DevOps / Platform', icon: 'dns' },
  CICD_ENGINEER: { label: 'CI/CD Engineer', icon: 'account_tree' },
  UNKNOWN: { label: 'Unknown', icon: 'help_outline' },
};

export const TEAM_OPTIONS: readonly ResponsibleTeam[] = ['DEVELOPER', 'DEVOPS_PLATFORM', 'CICD_ENGINEER', 'UNKNOWN'];

export function teamPresentation(team: ResponsibleTeam | null | undefined): TeamPresentation {
  return (team && TEAMS[team]) || TEAMS.UNKNOWN;
}

const OWNERSHIP: Readonly<Record<OwnershipConfidence, string>> = {
  HIGH: 'High ownership confidence',
  MEDIUM: 'Medium ownership confidence',
  LOW: 'Low ownership confidence',
};

export function ownershipLabel(confidence: OwnershipConfidence): string {
  return OWNERSHIP[confidence] ?? OWNERSHIP.LOW;
}

const STATUS_LABELS: Readonly<Record<ResolutionStatus, string>> = {
  OPEN: 'Open',
  INVESTIGATING: 'Investigating',
  FIX_IN_PROGRESS: 'Fix in progress',
  RESOLVED: 'Resolved',
  REOPENED: 'Reopened',
};

export function resolutionLabel(status: ResolutionStatus | null | undefined): string {
  return status ? STATUS_LABELS[status] : 'Not applicable';
}

export interface StatusAction {
  readonly status: ResolutionStatus;
  readonly label: string;
  readonly icon: string;
}

/** The action that moves a TaskRun resolution to each status. */
const ACTIONS: Readonly<Record<ResolutionStatus, StatusAction>> = {
  OPEN: { status: 'OPEN', label: 'Open', icon: 'flag' },
  INVESTIGATING: { status: 'INVESTIGATING', label: 'Start investigation', icon: 'manage_search' },
  FIX_IN_PROGRESS: { status: 'FIX_IN_PROGRESS', label: 'Mark fix in progress', icon: 'construction' },
  RESOLVED: { status: 'RESOLVED', label: 'Mark resolved', icon: 'task_alt' },
  REOPENED: { status: 'REOPENED', label: 'Reopen', icon: 'replay' },
};

export function statusActions(next: readonly ResolutionStatus[]): StatusAction[] {
  return next.map((status) => ACTIONS[status]);
}

/** Share of the failed TaskRuns that are resolved, 0 to 100; 100 when none failed. */
export function resolvedPercent(summary: PipelineTaskRunSummary | null | undefined): number {
  if (!summary || summary.failedTaskRuns === 0) {
    return 100;
  }
  return Math.round((summary.resolvedTaskRuns / summary.failedTaskRuns) * 100);
}
