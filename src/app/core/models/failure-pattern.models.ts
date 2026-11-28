/**
 * Mirrors the backend DTOs of the failure pattern analysis API (com.hackathon.agent.patterns.api.FailurePatternDtos and
 * com.hackathon.agent.patterns.model.FailurePatternReport). Every count, date and run reference in a report is computed
 * by the backend; the AI only names and explains the patterns.
 */
import { ResponsibleTeam } from './agent-investigation.models';
import { ResolutionStatus } from './resolution.models';

export type PatternPeriod = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';
/** PENDING = queued, RUNNING = being analysed; COMPLETED and FAILED are final. */
export type PatternAnalysisStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type PatternConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface StartPatternAnalysisRequest {
  readonly period: PatternPeriod;
  /** CUSTOM only; ISO-8601 instants, `to` exclusive. */
  readonly from?: string;
  readonly to?: string;
  readonly namespace?: string;
  readonly pipelineName?: string;
}

export interface PatternRunRef {
  /** Null when the PipelineRun of a TaskRun was not collected. */
  readonly id: number | null;
  readonly name: string;
  readonly namespace: string;
}

export interface PatternResolution {
  readonly byStatus: Readonly<Record<ResolutionStatus, number>>;
  readonly unresolved: number;
  readonly reopenCount: number;
  /** Failures that started after another failure of the pattern was marked resolved. */
  readonly recurrencesAfterResolution: number;
}

export interface FailurePattern {
  readonly title: string;
  readonly description: string;
  readonly failureCategory: string;
  readonly occurrences: number;
  /** Share of the analysed failed TaskRuns. */
  readonly percentage: number;
  readonly firstOccurrence: string | null;
  readonly lastOccurrence: string | null;
  readonly affectedPipelineRunCount: number;
  readonly affectedTaskRunCount: number;
  /** Most recent first, at most 20. */
  readonly affectedPipelineRuns: readonly PatternRunRef[];
  readonly affectedTaskRuns: readonly PatternRunRef[];
  readonly taskNames: readonly string[];
  readonly pipelineNames: readonly string[];
  readonly namespaces: readonly string[];
  readonly commonRootCause: string;
  readonly evidence: readonly string[];
  readonly responsibleTeam: ResponsibleTeam;
  readonly teamReason: string;
  readonly resolution: PatternResolution;
  readonly preventiveActions: readonly string[];
  readonly confidence: PatternConfidence;
  /** Why the backend lowered the confidence, if it did. */
  readonly confidenceReason: string | null;
  readonly signatureGroupIds: readonly string[];
  /** For each group of the pattern: its error signature and why its failures belong together (newer reports). */
  readonly groupingEvidence?: readonly string[];
}

/** Failures with one normalized error message, computed without AI. */
export interface SignatureGroup {
  readonly id: string;
  readonly signature: string;
  readonly failureCategory: string;
  readonly occurrences: number;
  readonly pipelineRuns: number;
  readonly taskNames: readonly string[];
  readonly firstOccurrence: string | null;
  readonly lastOccurrence: string | null;
  readonly resolution: PatternResolution;
  /** Why these failures are one group (newer reports). */
  readonly groupingBasis?: string;
}

export interface PatternStatistics {
  readonly from: string;
  readonly to: string;
  readonly namespace: string | null;
  readonly pipelineName: string | null;
  readonly totalPipelineRuns: number;
  readonly failedPipelineRuns: number;
  readonly totalTaskRuns: number;
  readonly failedTaskRuns: number;
  readonly sampledTaskRuns: number;
  readonly sampled: boolean;
  readonly taskRunsWithAiAnalysis: number;
  readonly signatureGroupCount: number;
  readonly failuresByCategory: Readonly<Record<string, number>>;
  readonly failuresByResolution: Readonly<Record<ResolutionStatus, number>>;
  readonly reopenedTaskRuns: number;
}

export interface FailurePatternReport {
  readonly statistics: PatternStatistics;
  readonly summary: string;
  readonly patterns: readonly FailurePattern[];
  readonly signatureGroups: readonly SignatureGroup[];
  readonly evidenceGaps: readonly string[];
  readonly limitations: readonly string[];
  /** False when the AI did not produce the patterns (nothing to analyse, or it failed). */
  readonly aiAnalysed: boolean;
}

export interface PatternAnalysis {
  readonly id: number;
  readonly period: PatternPeriod;
  readonly from: string;
  readonly to: string;
  readonly namespace: string | null;
  readonly pipelineName: string | null;
  readonly status: PatternAnalysisStatus;
  readonly failedTaskRuns: number | null;
  readonly patternCount: number | null;
  readonly summary: string | null;
  /** Null in lists; a FAILED analysis may still carry the statistics. */
  readonly report: FailurePatternReport | null;
  readonly errorMessage: string | null;
  readonly provider: string | null;
  readonly model: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

export function isPatternAnalysisActive(status: PatternAnalysisStatus): boolean {
  return status === 'PENDING' || status === 'RUNNING';
}

export const PATTERN_PERIOD_LABELS: Readonly<Record<PatternPeriod, string>> = {
  LAST_7_DAYS: 'Last 7 days',
  LAST_30_DAYS: 'Last 30 days',
  LAST_90_DAYS: 'Last 90 days',
  CUSTOM: 'Custom range',
};
