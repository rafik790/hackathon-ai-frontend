import { ApiError } from '../../../core/models/api-error.model';
import { AgentInvestigation, AgentInvestigationStep, InvestigationStatus } from '../../../core/models/agent-investigation.models';
import { PageResponse } from '../../../core/models/execution.models';

export const TARGET = { kind: 'TASK_RUN', name: 'demo-app-build-bb7hj-build-and-push', namespace: 'ci' } as const;

export function investigation(status: InvestigationStatus, change: Partial<AgentInvestigation> = {}): AgentInvestigation {
  return {
    id: 7,
    targetType: 'TASK_RUN',
    targetName: TARGET.name,
    namespace: TARGET.namespace,
    taskRunId: 52,
    pipelineRunId: 3,
    status,
    stepCount: 0,
    toolCallCount: 0,
    summary: null,
    rootCause: null,
    failureCategory: null,
    confidence: null,
    report: null,
    errorMessage: null,
    provider: 'anthropic',
    model: 'claude',
    inputTokens: 0,
    outputTokens: 0,
    createdAt: '2026-11-28T10:00:00Z',
    startedAt: status === 'PENDING' ? null : '2026-11-28T10:00:01Z',
    completedAt: null,
    ...change,
  };
}

export const LOG_STEP: AgentInvestigationStep = {
  stepNumber: 1,
  action: 'CALL_TOOL',
  toolName: 'get_taskrun_logs',
  arguments: { toolName: 'get_taskrun_logs', resourceName: TARGET.name, namespace: TARGET.namespace },
  reasoning: 'The TaskRun failed in its build step; the log shows why.',
  status: 'SUCCEEDED',
  resultSummary: '{"containers":[{"name":"step-build","log":"error: cannot find symbol"}]}',
  errorMessage: null,
  durationMs: 120,
  createdAt: '2026-11-28T10:00:02Z',
};

export const REJECTED_STEP: AgentInvestigationStep = {
  stepNumber: 2,
  action: 'CALL_TOOL',
  toolName: 'get_deployment_status',
  arguments: { toolName: 'get_deployment_status', resourceName: 'demo-app', namespace: 'kube-system' },
  reasoning: 'Check whether the deployment is healthy.',
  status: 'REJECTED',
  resultSummary: null,
  errorMessage: 'Namespace kube-system is not monitored',
  durationMs: null,
  createdAt: '2026-11-28T10:00:03Z',
};

export const REPORT_STEP: AgentInvestigationStep = {
  stepNumber: 3,
  action: 'FINAL_REPORT',
  toolName: null,
  arguments: null,
  reasoning: 'The log explains the failure.',
  status: 'COMPLETED',
  resultSummary: null,
  errorMessage: null,
  durationMs: null,
  createdAt: '2026-11-28T10:00:04Z',
};

export const COMPLETED = investigation('COMPLETED', {
  stepCount: 3,
  toolCallCount: 1,
  summary: 'The build failed because the code does not compile.',
  rootCause: 'OrderService uses a symbol that does not exist.',
  failureCategory: 'COMPILATION_ERROR',
  confidence: 0.9,
  completedAt: '2026-11-28T10:00:05Z',
  report: {
    summary: 'The build failed because the code does not compile.',
    rootCause: 'OrderService uses a symbol that does not exist.',
    failureCategory: 'COMPILATION_ERROR',
    confidence: 0.9,
    evidence: [{ step: 1, observation: 'error: cannot find symbol' }],
    recommendedActions: ['Fix the compile error in OrderService and push again.'],
    unverifiedEvidence: 1,
  },
});

export function page(...content: AgentInvestigation[]): PageResponse<AgentInvestigation> {
  return { content, page: 0, size: 1, totalElements: content.length, totalPages: 1, first: true, last: true, sort: 'createdAt,desc' };
}

export function apiError(status: number, message: string): ApiError {
  return { status, title: 'Error', message, path: null, fieldErrors: [] };
}

/** A report with ownership, resolution and verification, for a missing RBAC permission. */
export const RBAC_COMPLETED = investigation('COMPLETED', {
  id: 9,
  stepCount: 3,
  toolCallCount: 2,
  failureCategory: 'PERMISSION_DENIED',
  confidence: 0.92,
  report: {
    title: 'Pipeline service account cannot create Deployments in ci',
    summary: 'The deploy task failed because its service account may not create Deployments.',
    rootCause: 'The pipeline runs as pipeline-deployer, which may only read PipelineRuns, so creating the Deployment was refused.',
    failureCategory: 'PERMISSION_DENIED',
    confidence: 0.92,
    evidence: [{ step: 1, observation: 'cannot create resource "deployments" in API group "apps"' }],
    recommendedActions: ['Grant create on Deployments'],
    unverifiedEvidence: 0,
    ownership: { team: 'DEVOPS_PLATFORM', confidence: 'HIGH', reason: 'RBAC in namespace ci is managed by the platform team.' },
    resolutionSteps: [
      { action: 'Create a Role and RoleBinding for pipeline-deployer in ci', command: 'kind: Role\nmetadata:\n  name: <role-name>\n  namespace: ci' },
      { action: 'Rerun the PipelineRun', command: null },
    ],
    otherTeamChecks: [{ team: 'DEVELOPER', request: 'Confirm that the deploy task should run as pipeline-deployer' }],
    verificationSteps: [
      { action: 'Check the permission', command: 'kubectl auth can-i create deployments -n ci --as=system:serviceaccount:ci:pipeline-deployer' },
    ],
    expectedOutcome: 'The deploy task creates the Deployment and the PipelineRun succeeds.',
    missingInformation: [],
    nextDiagnosticAction: null,
    removedCommands: 1,
  },
});
