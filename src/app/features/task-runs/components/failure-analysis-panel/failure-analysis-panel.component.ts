import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TaskRunAnalysisStore } from '../../services/task-run-analysis.store';

const REANALYSE_CONFIRMATION: ConfirmDialogData = {
  title: 'Analyse this failure again?',
  message:
    'The collected failure evidence is sent to the AI model again. The result is stored as a new revision; the current ' +
    'analysis stays available until then. This uses one invocation of the daily AI analysis quota.',
  confirmLabel: 'Re-analyse',
};

/** AI failure analysis of a failed TaskRun in every state of its lifecycle. */
@Component({
  selector: 'app-failure-analysis-panel',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './failure-analysis-panel.component.html',
  styleUrls: ['./failure-analysis-panel.component.scss'],
  providers: [TaskRunAnalysisStore],
})
export class FailureAnalysisPanelComponent implements OnChanges {
  @Input({ required: true }) taskRunId!: number;

  readonly state$ = this.store.state$;

  constructor(private readonly store: TaskRunAnalysisStore, private readonly dialog: MatDialog) {}

  ngOnChanges(): void {
    this.store.setTaskRun(this.taskRunId);
  }

  reload(): void {
    this.store.reload();
  }

  requestAnalysis(): void {
    this.store.request();
  }

  /** Only after confirmation, because it uses AI quota. */
  reanalyse(): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: REANALYSE_CONFIRMATION,
        width: '440px',
        maxWidth: '92vw',
      })
      .afterClosed()
      .pipe(filter((confirmed) => confirmed === true))
      .subscribe(() => this.store.reanalyse());
  }

  /** What went wrong, in the words of the backend where it explains it. */
  requestErrorTitle(error: ApiError): string {
    if (error.status === 429) {
      return 'The daily AI analysis quota is used up.';
    }
    if (error.status === 409) {
      return 'The analysis cannot be requested right now.';
    }
    return 'The analysis could not be requested.';
  }
}
