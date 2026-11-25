import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { TaskRunAnalysisStore } from '../../services/task-run-analysis.store';

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

  constructor(private readonly store: TaskRunAnalysisStore) {}

  ngOnChanges(): void {
    this.store.setTaskRun(this.taskRunId);
  }

  reload(): void {
    this.store.reload();
  }

  requestAnalysis(): void {
    this.store.request();
  }
}
