import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ApiError } from '../../../../core/models/api-error.model';
import { AgentInvestigationStep, isInvestigationActive } from '../../../../core/models/agent-investigation.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { failureCategoryLabel } from '../../../../shared/failure-analysis/failure-analysis-presentation';
import { ownershipLabel, teamPresentation } from '../../../../shared/resolution/resolution-presentation';
import { AgentInvestigationStore, InvestigationTarget } from '../../services/agent-investigation.store';

interface ToolPresentation {
  readonly label: string;
  readonly icon: string;
}

/** The read-only tools of the backend; unknown names are shown as they are. */
const TOOLS: Readonly<Record<string, ToolPresentation>> = {
  get_pipelinerun_details: { label: 'PipelineRun details', icon: 'account_tree' },
  get_taskrun_details: { label: 'TaskRun details', icon: 'checklist' },
  get_taskrun_logs: { label: 'TaskRun logs', icon: 'terminal' },
  get_pod_events: { label: 'Pod events', icon: 'event_note' },
  get_deployment_status: { label: 'Deployment status', icon: 'rocket_launch' },
  get_serviceaccount_details: { label: 'Service account and permissions', icon: 'admin_panel_settings' },
  get_previous_successful_pipelinerun: { label: 'Previous successful run', icon: 'history' },
};

/**
 * Investigation of a failed run by the AI agent, which chooses read-only tools step by step. Separate from the
 * failure analysis above it: that one explains collected evidence, this one collects evidence itself.
 */
@Component({
  selector: 'app-agent-investigation-panel',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-investigation-panel.component.html',
  styleUrls: ['./agent-investigation-panel.component.scss'],
  providers: [AgentInvestigationStore],
})
export class AgentInvestigationPanelComponent implements OnChanges {
  @Input({ required: true }) target!: InvestigationTarget;

  readonly state$ = this.store.state$;
  readonly isActive = isInvestigationActive;
  readonly category = failureCategoryLabel;

  constructor(private readonly store: AgentInvestigationStore, notifications: NotificationService) {
    // Completes with the store when the component is destroyed.
    this.store.started$.subscribe((investigation) =>
      notifications.info(`AI agent investigation #${investigation.id} started`));
  }

  ngOnChanges(): void {
    this.store.setTarget(this.target);
  }

  investigate(): void {
    this.store.start();
  }

  reload(): void {
    this.store.reload();
  }

  tool(step: AgentInvestigationStep): ToolPresentation {
    if (step.action === 'FINAL_REPORT') {
      return { label: 'Final report', icon: 'task_alt' };
    }
    if (step.action === 'INVALID') {
      return { label: 'Unusable answer', icon: 'report' };
    }
    const name = step.toolName ?? step.arguments?.['toolName'] ?? 'Unknown tool';
    return TOOLS[name] ?? { label: name, icon: 'build' };
  }

  readonly team = teamPresentation;
  readonly ownershipLabel = ownershipLabel;

  /** Tool results are JSON; shown indented when they are complete. */
  formatResult(text: string): string {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  confidencePercent(confidence: number | null | undefined): number {
    return Math.round((confidence ?? 0) * 100);
  }

  startErrorTitle(error: ApiError): string {
    if (error.status === 429) {
      return 'The daily AI quota is used up.';
    }
    if (error.status === 409) {
      return 'The investigation cannot be started.';
    }
    if (error.status === 404) {
      return 'The run is not known to the agent.';
    }
    return 'The investigation could not be started.';
  }

  trackStep(_: number, step: AgentInvestigationStep): number {
    return step.stepNumber;
  }
}
