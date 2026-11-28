import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApiError } from '../../../../core/models/api-error.model';
import {
  FailurePattern,
  PATTERN_PERIOD_LABELS,
  PatternAnalysis,
  PatternConfidence,
  PatternPeriod,
  StartPatternAnalysisRequest,
  isPatternAnalysisActive,
} from '../../../../core/models/failure-pattern.models';
import { createDateRangeForm } from '../../../../shared/components/date-range-filter/date-range-filter.component';
import { failureCategoryLabel } from '../../../../shared/failure-analysis/failure-analysis-presentation';
import { ResolutionStatus } from '../../../../core/models/resolution.models';
import { resolutionLabel, teamPresentation } from '../../../../shared/resolution/resolution-presentation';
import { FailurePatternStore } from '../../services/failure-pattern.store';

export const PATTERN_PERIODS: readonly PatternPeriod[] = ['LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'CUSTOM'];
/** Summaries longer than this are shortened to two lines until the user expands them. */
const SUMMARY_CHARS = 220;
const STATUSES: readonly ResolutionStatus[] = ['OPEN', 'INVESTIGATING', 'FIX_IN_PROGRESS', 'RESOLVED', 'REOPENED'];

/**
 * Failure Pattern Analysis on the Failure Analysis page: the user picks a period and starts an AI analysis of the
 * recurring failures in it. Nothing runs unless the user starts it. Read-only: it never changes a resolution.
 */
@Component({
  selector: 'app-failure-pattern-analysis',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './failure-pattern-analysis.component.html',
  styleUrls: ['./failure-pattern-analysis.component.scss'],
  providers: [FailurePatternStore],
})
export class FailurePatternAnalysisComponent implements OnInit {
  /** Namespace filter of the page; null for all monitored namespaces. */
  @Input() namespace: string | null = null;

  readonly state$ = this.store.state$;
  readonly periods = PATTERN_PERIODS;
  readonly periodLabels = PATTERN_PERIOD_LABELS;
  readonly period = new FormControl<PatternPeriod>('LAST_7_DAYS', { nonNullable: true });
  readonly range = createDateRangeForm();
  readonly statuses = STATUSES;
  readonly resolutionLabel = resolutionLabel;
  /** Analysis whose summary is shown in full. */
  private openSummary: number | null = null;
  /** Expanded patterns, as analysis id and pattern index. */
  private readonly openPatterns = new Set<string>();

  constructor(private readonly store: FailurePatternStore) {}

  ngOnInit(): void {
    this.store.load();
  }

  get customIncomplete(): boolean {
    return this.period.value === 'CUSTOM' && (!this.range.value.start || !this.range.value.end);
  }

  analyse(): void {
    const request = this.request();
    if (request) {
      this.store.start(request);
    }
  }

  select(analysis: PatternAnalysis): void {
    this.store.select(analysis.id);
  }

  /** The period as the backend expects it; custom days are whole local days, the end day included. */
  request(): StartPatternAnalysisRequest | null {
    const period = this.period.value;
    const namespace = this.namespace ? { namespace: this.namespace } : {};
    if (period !== 'CUSTOM') {
      return { period, ...namespace };
    }
    const { start, end } = this.range.value;
    if (!start || !end) {
      return null;
    }
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const to = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
    return { period, from: from.toISOString(), to: to.toISOString(), ...namespace };
  }

  isActive(analysis: PatternAnalysis | null): boolean {
    return !!analysis && isPatternAnalysisActive(analysis.status);
  }

  category(value: string): string {
    return failureCategoryLabel(value);
  }

  team(pattern: FailurePattern): string {
    return teamPresentation(pattern.responsibleTeam).label;
  }

  confidenceTone(confidence: PatternConfidence): string {
    return confidence === 'HIGH' ? 'success' : confidence === 'MEDIUM' ? 'warning' : 'neutral';
  }

  startErrorTitle(error: ApiError): string {
    switch (error.status) {
      case 409:
        return 'Cannot start now.';
      case 429:
        return 'AI quota exhausted.';
      case 400:
        return 'Check the period.';
      default:
        return 'The analysis could not be started.';
    }
  }

  teamIcon(pattern: FailurePattern): string {
    return teamPresentation(pattern.responsibleTeam).icon;
  }

  isOpen(analysisId: number, index: number): boolean {
    return this.openPatterns.has(`${analysisId}:${index}`);
  }

  toggle(analysisId: number, index: number): void {
    const key = `${analysisId}:${index}`;
    if (!this.openPatterns.delete(key)) {
      this.openPatterns.add(key);
    }
  }

  isLong(summary: string | null | undefined): boolean {
    return (summary?.length ?? 0) > SUMMARY_CHARS;
  }

  summaryOpen(id: number): boolean {
    return this.openSummary === id;
  }

  toggleSummary(id: number): void {
    this.openSummary = this.openSummary === id ? null : id;
  }

  trackById(_: number, analysis: PatternAnalysis): number {
    return analysis.id;
  }
}
