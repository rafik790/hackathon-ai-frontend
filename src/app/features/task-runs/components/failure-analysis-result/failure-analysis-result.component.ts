import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FailureAnalysis, SupportingEvidence } from '../../../../core/models/failure-analysis.models';
import { evidenceSourcePresentation, failureCategoryLabel } from '../../../../shared/failure-analysis/failure-analysis-presentation';
import { statusPresentation } from '../../../../shared/utils/status';

interface DetailList {
  readonly title: string;
  readonly icon: string;
  readonly items: readonly string[];
}

/** Result of a completed analysis, as returned by the backend. */
@Component({
  selector: 'app-failure-analysis-result',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './failure-analysis-result.component.html',
  styleUrls: ['./failure-analysis-result.component.scss'],
})
export class FailureAnalysisResultComponent {
  @Input({ required: true }) analysis!: FailureAnalysis;

  readonly source = evidenceSourcePresentation;

  get category(): string {
    return failureCategoryLabel(this.analysis.failureCategory);
  }

  get confidencePercent(): number {
    return Math.round((this.analysis.confidence ?? 0) * 100);
  }

  get confidenceLabel(): string {
    return statusPresentation(this.analysis.confidenceLevel).label;
  }

  get detailLists(): readonly DetailList[] {
    const { observedFacts, hypotheses, preventiveRecommendations } = this.analysis;
    return [
      { title: 'Observed facts', icon: 'fact_check', items: observedFacts ?? [] },
      { title: 'Hypotheses (not confirmed)', icon: 'help_outline', items: hypotheses ?? [] },
      { title: 'Preventive recommendations', icon: 'shield', items: preventiveRecommendations ?? [] },
    ].filter((list) => list.items.length > 0);
  }

  isLog(evidence: SupportingEvidence): boolean {
    return evidence.source === 'CONTAINER_LOG';
  }
}
