import { FailureAnalysis } from '../../../core/models/failure-analysis.models';

/** Structure and texts of real backend responses. Only used by tests. */
export const COMPILATION_ANALYSIS: FailureAnalysis = {
  id: 3,
  failureEvidenceId: 2,
  taskRunId: 52,
  taskRunName: 'demo-app-build-bb7hj-build-and-push',
  taskName: 'build-and-push',
  pipelineRunName: 'demo-app-build-bb7hj',
  namespace: 'hackathon',
  attempt: 0,
  status: 'COMPLETED',
  failureCategory: 'COMPILATION',
  severity: 'HIGH',
  confidence: 0.97,
  confidenceLevel: 'HIGH',
  summary: 'Compilation failed in DemoController.java:16: unclosed string literal.',
  rootCause: 'DemoController.java has an unclosed string literal at line 16 (System.out.println("I get fired);).',
  observedFacts: ['step-build-and-push exited with code 1, reason Error'],
  hypotheses: ["The ';' expected error at line 21 is a follow-on error"],
  supportingEvidence: [
    {
      source: 'CONTAINER_LOG',
      containerName: 'step-build-and-push',
      observation: '/app/src/main/java/com/hackathon/demo/controller/DemoController.java:16: error: unclosed string literal',
    },
    { source: 'CONTAINER_STATUS', containerName: 'step-build-and-push', observation: 'exitCode 1' },
    { source: 'TASK_RUN', containerName: null, observation: '"step-build-and-push" exited with code 1: Error' },
  ],
  recommendedActions: [
    { priority: 'HIGH', action: 'Close the string literal in DemoController.java line 16', reason: 'The compiler reports it' },
    { priority: 'MEDIUM', action: 'Run ./gradlew clean bootJar locally', reason: 'It shows whether the correction is complete' },
    { priority: 'LOW', action: 'Add a compile validation step', reason: 'Errors are reported earlier' },
  ],
  preventiveRecommendations: ['Run a Gradle compile job on pull requests'],
  provider: 'anthropic',
  model: 'claude-opus-5-5',
  analysisVersion: 1,
  promptVersion: 'v4',
  revision: 0,
  inputTokens: 5924,
  outputTokens: 1206,
  processingAttempts: 1,
  lastError: null,
  nextAttemptAt: null,
  analysedAt: '2026-11-25T20:54:43.550273Z',
  createdAt: '2026-11-25T20:54:13.284927Z',
  updatedAt: '2026-11-25T20:54:43.550273Z',
};

export const RBAC_ANALYSIS: FailureAnalysis = {
  ...COMPILATION_ANALYSIS,
  id: 4,
  failureEvidenceId: 3,
  taskRunId: 58,
  taskRunName: 'demo-app-build-restricted-cwcrf-deploy',
  taskName: 'deploy',
  failureCategory: 'PERMISSION_DENIED',
  confidence: 0.95,
  summary: 'Deploy task failed because service account tekton-restricted-builder is forbidden to get deployments.apps.',
  rootCause: 'system:serviceaccount:hackathon:tekton-restricted-builder lacks RBAC permission to get deployments.',
  supportingEvidence: [
    {
      source: 'CONTAINER_LOG',
      containerName: 'step-deploy',
      observation:
        'Error from server (Forbidden): deployments.apps "hackathon-demo-app" is forbidden: User "system:serviceaccount:hackathon:tekton-restricted-builder" cannot get resource "deployments"',
    },
  ],
  recommendedActions: [
    { priority: 'HIGH', action: 'Create a Role and RoleBinding for tekton-restricted-builder', reason: 'The API server denied get' },
    { priority: 'MEDIUM', action: 'Verify with kubectl auth can-i', reason: 'Confirms the fix' },
  ],
};

const NO_RESULT = {
  failureCategory: null,
  severity: null,
  confidence: null,
  confidenceLevel: null,
  summary: null,
  rootCause: null,
  observedFacts: null,
  hypotheses: null,
  supportingEvidence: null,
  recommendedActions: null,
  preventiveRecommendations: null,
  analysedAt: null,
} as const;

export function unfinishedAnalysis(status: FailureAnalysis['status'], change: Partial<FailureAnalysis> = {}): FailureAnalysis {
  return { ...COMPILATION_ANALYSIS, ...NO_RESULT, status, ...change };
}
