import { Resolution, ResolutionHistoryEntry } from '../../../core/models/resolution.models';

export function resolution(change: Partial<Resolution> = {}): Resolution {
  return {
    targetType: 'TASK_RUN',
    taskRunId: 52,
    pipelineRunId: 3,
    targetName: 'demo-app-build-bb7hj-deploy',
    namespace: 'ci',
    executionStatus: 'FAILED',
    tracked: false,
    status: 'OPEN',
    nextStatuses: ['INVESTIGATING', 'FIX_IN_PROGRESS'],
    assignedTeam: null,
    assignedPerson: null,
    summary: null,
    notes: null,
    updatedBy: null,
    createdAt: null,
    updatedAt: null,
    resolvedAt: null,
    version: null,
    taskRuns: null,
    ...change,
  };
}

export const FIX_IN_PROGRESS = resolution({
  tracked: true,
  status: 'FIX_IN_PROGRESS',
  nextStatuses: ['RESOLVED'],
  assignedTeam: 'DEVOPS_PLATFORM',
  assignedPerson: 'Priya',
  summary: 'Grant the pipeline service account create on Deployments',
  notes: 'Role drafted, waiting for review',
  updatedBy: 'priya',
  createdAt: '2026-11-28T10:00:00Z',
  updatedAt: '2026-11-28T10:30:00Z',
  version: 1,
});

export const HISTORY: ResolutionHistoryEntry[] = [
  {
    id: 1, taskRunId: 52, taskRunName: 'demo-app-build-bb7hj-deploy', previousStatus: null, newStatus: 'INVESTIGATING', assignedTeam: 'DEVOPS_PLATFORM', assignedPerson: null,
    summary: null, note: 'Looking at the agent report', changedBy: 'priya', changedAt: '2026-11-28T10:00:00Z',
  },
  {
    id: 2, taskRunId: 52, taskRunName: 'demo-app-build-bb7hj-deploy', previousStatus: 'INVESTIGATING', newStatus: 'FIX_IN_PROGRESS', assignedTeam: 'DEVOPS_PLATFORM', assignedPerson: 'Priya',
    summary: 'Grant the pipeline service account create on Deployments', note: null, changedBy: null, changedAt: '2026-11-28T10:30:00Z',
  },
];

/** Derived resolution of a PipelineRun with two failed TaskRuns, one of them resolved, the other open. */
export const PIPELINE = resolution({
  targetType: 'PIPELINE_RUN',
  taskRunId: null,
  pipelineRunId: 3,
  targetName: 'demo-app-build-bb7hj',
  tracked: true,
  status: 'OPEN',
  nextStatuses: [],
  version: null,
  summary: '1 of 2 failed TaskRuns resolved',
  updatedAt: '2026-11-28T10:20:00Z',
  taskRuns: {
    failedTaskRuns: 2,
    resolvedTaskRuns: 1,
    unresolvedTaskRuns: 1,
    byStatus: { RESOLVED: 1, OPEN: 1 },
    items: [
      { taskRunId: 52, taskRunName: 'demo-app-build-bb7hj-deploy', taskName: 'deploy', executionStatus: 'FAILED', status: 'RESOLVED',
        tracked: true, assignedTeam: 'DEVOPS_PLATFORM', summary: 'RBAC fixed', updatedAt: '2026-11-28T10:20:00Z', resolvedAt: '2026-11-28T10:20:00Z' },
      { taskRunId: null, taskRunName: 'demo-app-build-bb7hj-test', taskName: null, executionStatus: null, status: 'OPEN',
        tracked: false, assignedTeam: null, summary: null, updatedAt: null, resolvedAt: null },
    ],
  },
});
