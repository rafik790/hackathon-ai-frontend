import { ChangeDetectionStrategy, Component, Input, Optional } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, Observable } from 'rxjs';
import { AgentInvestigation, ResponsibleTeam } from '../../core/models/agent-investigation.models';
import { Resolution, ResolutionStatus } from '../../core/models/resolution.models';
import { editResolution } from './resolution-editor';
import { resolutionLabel, teamPresentation } from './resolution-presentation';
import { ResolutionState, ResolutionStore } from './resolution.store';

/** What an agent report suggests for the TaskRun resolution; applied only when a person saves it in the dialog. */
export interface ResolutionSuggestion {
  readonly status: ResolutionStatus;
  readonly team: ResponsibleTeam | null;
  readonly text: string;
}

/**
 * Offers to apply what a completed AI agent investigation suggests to the TaskRun resolution: the responsible team
 * and, for an open failure, Investigating. The resolution itself is shown in its own section; this is only the offer.
 * Applying it opens the resolution dialog, so the TaskRun record changes only when the person saves. Renders nothing
 * without a {@link ResolutionStore} on the page or without a suggestion.
 */
@Component({
  selector: 'app-resolution-suggestion',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resolution-suggestion.component.html',
  styleUrls: ['./resolution-suggestion.component.scss'],
})
export class ResolutionSuggestionComponent {
  @Input({ required: true }) investigation!: AgentInvestigation;

  readonly state$: Observable<ResolutionState> = this.store?.state$ ?? EMPTY;

  constructor(@Optional() private readonly store: ResolutionStore | null, private readonly dialog: MatDialog) {}

  suggestion(resolution: Resolution): ResolutionSuggestion | null {
    const report = this.investigation.status === 'COMPLETED' ? this.investigation.report : null;
    if (!report || !resolution.status || resolution.targetType !== 'TASK_RUN') {
      return null;
    }
    const owner = report.ownership?.team;
    const team = owner && owner !== 'UNKNOWN' ? owner : null;
    if (resolution.nextStatuses.includes('INVESTIGATING') && (resolution.status === 'OPEN' || resolution.status === 'REOPENED')) {
      return {
        status: 'INVESTIGATING',
        team,
        text: `${resolutionLabel('INVESTIGATING')}${team ? ', assigned to ' + teamPresentation(team).label : ''}`,
      };
    }
    if (team && !resolution.assignedTeam && resolution.status !== 'RESOLVED') {
      return { status: resolution.status, team, text: `Assign to ${teamPresentation(team).label}` };
    }
    return null;
  }

  apply(suggestion: ResolutionSuggestion): void {
    if (!this.store) {
      return;
    }
    const report = this.investigation.report;
    editResolution(this.dialog, this.store, {
      prefill: {
        status: suggestion.status,
        assignedTeam: suggestion.team ?? undefined,
        summary: this.store.snapshot.resolution?.summary || report?.title || undefined,
        comment: `Based on AI agent investigation #${this.investigation.id}`,
      },
      hint: `Suggested by AI agent investigation #${this.investigation.id}. Nothing changes until you save.`,
    });
  }
}
