/**
 * Mirrors the backend DTOs of the agent investigation API (com.hackathon.agent.investigation.api.AgentInvestigationDtos
 * and com.hackathon.agent.investigation.model). Result fields are null until the investigation is COMPLETED.
 */

/** PENDING = queued, RUNNING = the agent is working; COMPLETED and FAILED are final. */
export type InvestigationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type InvestigationTargetType = 'TASK_RUN' | 'PIPELINE_RUN';
/** What the model asked for in a step. */
export type InvestigationStepAction = 'CALL_TOOL' | 'FINAL_REPORT' | 'INVALID';
/** SUCCEEDED/FAILED: the tool ran; REJECTED: the backend refused the request; COMPLETED: the report was accepted. */
export type InvestigationStepStatus = 'SUCCEEDED' | 'FAILED' | 'REJECTED' | 'COMPLETED';

export interface AgentReportEvidence {
  /** Number of the step whose tool result contains the observation. */
  readonly step: number;
  readonly observation: string;
}

/** Who most likely has to fix the failure. */
export type ResponsibleTeam = 'DEVELOPER' | 'DEVOPS_PLATFORM' | 'CICD_ENGINEER' | 'UNKNOWN';
/** LOW whenever the cause is unproven or the team is unknown (enforced by the backend). */
export type OwnershipConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AgentReportOwnership {
  readonly team: ResponsibleTeam;
  readonly confidence: OwnershipConfidence;
  /** Why this team, based on the evidence. */
  readonly reason: string;
}

export interface AgentReportStep {
  readonly action: string;
  /** Command or configuration to apply, possibly several lines; null when the step needs none. */
  readonly command: string | null;
}

export interface AgentReportTeamCheck {
  readonly team: ResponsibleTeam;
  /** What that team has to confirm or provide. */
  readonly request: string;
}

/**
 * The fields from title on are null in reports written before they existed; the UI then falls back to
 * recommendedActions.
 */
export interface AgentReport {
  readonly summary: string;
  readonly rootCause: string;
  /** A failure category name, e.g. PERMISSION_DENIED. */
  readonly failureCategory: string;
  /** 0 to 1; at most 0.3 without verified evidence. */
  readonly confidence: number;
  /** Only observations the backend found literally in the cited step. */
  readonly evidence: readonly AgentReportEvidence[];
  readonly recommendedActions: readonly string[];
  /** Evidence items of the model that were removed because they could not be verified. */
  readonly unverifiedEvidence: number;
  readonly title?: string | null;
  readonly ownership?: AgentReportOwnership | null;
  /** What the responsible team does, in order. */
  readonly resolutionSteps?: readonly AgentReportStep[] | null;
  /** What another team has to confirm or provide. */
  readonly otherTeamChecks?: readonly AgentReportTeamCheck[] | null;
  readonly verificationSteps?: readonly AgentReportStep[] | null;
  readonly expectedOutcome?: string | null;
  /** What the evidence does not show; present whenever the cause or the owner is uncertain. */
  readonly missingInformation?: readonly string[] | null;
  readonly nextDiagnosticAction?: string | null;
  /** Commands the backend removed as unsafe or naming resources the investigation never saw. */
  readonly removedCommands?: number | null;
}

export interface AgentInvestigation {
  readonly id: number;
  readonly targetType: InvestigationTargetType;
  readonly targetName: string;
  readonly namespace: string;
  readonly taskRunId: number | null;
  readonly pipelineRunId: number | null;
  readonly status: InvestigationStatus;
  /** Questions to the model so far. */
  readonly stepCount: number;
  /** Executed tools so far. */
  readonly toolCallCount: number;
  readonly summary: string | null;
  readonly rootCause: string | null;
  readonly failureCategory: string | null;
  readonly confidence: number | null;
  readonly report: AgentReport | null;
  /** Why the investigation failed. */
  readonly errorMessage: string | null;
  readonly provider: string | null;
  readonly model: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly createdAt: string | null;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

export interface AgentInvestigationStep {
  readonly stepNumber: number;
  readonly action: InvestigationStepAction;
  readonly toolName: string | null;
  /** Sanitized arguments as requested by the model: toolName, resourceName, namespace. */
  readonly arguments: Readonly<Record<string, string>> | null;
  /** Why the model chose this step. */
  readonly reasoning: string | null;
  readonly status: InvestigationStepStatus;
  /** Sanitized, shortened tool result (usually JSON). */
  readonly resultSummary: string | null;
  readonly errorMessage: string | null;
  readonly durationMs: number | null;
  readonly createdAt: string | null;
}

/** Body of POST /api/v1/agent-investigations: exactly one of the two names. */
export type StartInvestigationRequest =
  | { readonly taskRunName: string; readonly namespace: string }
  | { readonly pipelineRunName: string; readonly namespace: string };

export interface AgentInvestigationFilter {
  readonly taskRunName?: string | null;
  readonly pipelineRunName?: string | null;
  readonly namespace?: string | null;
  readonly status?: InvestigationStatus | null;
}

export function isInvestigationActive(status: InvestigationStatus): boolean {
  return status === 'PENDING' || status === 'RUNNING';
}
