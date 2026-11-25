/**
 * Mirrors the backend DTOs FailureAnalysisResponse and FailureAnalysisSummaryResponse in com.hackathon.agent.dto.
 * Result fields are null until the analysis is COMPLETED.
 */

/** com.hackathon.agent.ai.model.AnalysisStatus. */
export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'RETRY_PENDING' | 'FAILED';

export type AnalysisSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceSource = 'CONTAINER_LOG' | 'CONTAINER_STATUS' | 'POD_STATUS' | 'TASK_RUN' | 'PIPELINE_RUN';

export interface RecommendedAction {
  readonly priority: RecommendationPriority;
  readonly action: string;
  readonly reason: string;
}

export interface SupportingEvidence {
  readonly source: EvidenceSource;
  readonly containerName: string | null;
  readonly observation: string;
}

export interface FailureAnalysisSummary {
  readonly id: number;
  readonly failureEvidenceId: number;
  readonly taskRunId: number;
  readonly taskRunName: string;
  readonly taskName: string | null;
  readonly pipelineRunName: string | null;
  readonly namespace: string;
  /** Zero-based attempt of the TaskRun. */
  readonly attempt: number;
  readonly status: AnalysisStatus;
  /** com.hackathon.agent.ai.model.FailureCategory, e.g. COMPILATION. */
  readonly failureCategory: string | null;
  readonly severity: AnalysisSeverity | null;
  /** 0 to 1. */
  readonly confidence: number | null;
  readonly confidenceLevel: ConfidenceLevel | null;
  readonly summary: string | null;
  readonly analysedAt: string | null;
  readonly createdAt: string | null;
}

export interface FailureAnalysis extends FailureAnalysisSummary {
  readonly rootCause: string | null;
  readonly observedFacts: readonly string[] | null;
  readonly hypotheses: readonly string[] | null;
  readonly supportingEvidence: readonly SupportingEvidence[] | null;
  readonly recommendedActions: readonly RecommendedAction[] | null;
  readonly preventiveRecommendations: readonly string[] | null;
  readonly provider: string | null;
  readonly model: string | null;
  readonly analysisVersion: number;
  readonly promptVersion: string;
  /** Above 0 for manual re-analyses. */
  readonly revision: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly processingAttempts: number;
  /** Reason of the last failed attempt. */
  readonly lastError: string | null;
  readonly nextAttemptAt: string | null;
  readonly updatedAt: string | null;
}

/** Sort properties accepted by GET /api/v1/failure-analyses. */
export type FailureAnalysisSortField =
  | 'id'
  | 'analysisStatus'
  | 'failureCategory'
  | 'severity'
  | 'confidence'
  | 'analysedAt'
  | 'createdAt'
  | 'updatedAt';

/** Filters of GET /api/v1/failure-analyses. */
export interface FailureAnalysisFilter {
  readonly category?: string | null;
  readonly severity?: AnalysisSeverity | null;
  readonly status?: AnalysisStatus | null;
}

export function isAnalysisInProgress(status: AnalysisStatus): boolean {
  return status === 'PENDING' || status === 'PROCESSING' || status === 'RETRY_PENDING';
}
