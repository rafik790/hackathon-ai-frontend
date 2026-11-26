import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { TimeRangePreset, parseTimeRangePreset } from '../../../../core/models/dashboard.models';
import { TaskRun } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { PreferencesService } from '../../../../core/services/preferences.service';
import { RefreshService } from '../../../../core/services/refresh.service';
import { TableColumn } from '../../../../shared/components/data-table/data-table.models';
import { FailureFilters } from '../../models/failure-analysis.models';
import { FailureAnalysisService } from '../../services/failure-analysis.service';

const RECENT_LIMIT = 10;

@Component({
  selector: 'app-failure-analysis',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './failure-analysis.component.html',
  styleUrls: ['./failure-analysis.component.scss'],
})
export class FailureAnalysisComponent {
  readonly filters$ = this.route.queryParamMap.pipe(
    map((params): FailureFilters => ({
      range: parseTimeRangePreset(params.get('range')) ?? this.preferences.snapshot.defaultRange,
      namespace: params.get('namespace') || null,
    })),
    distinctUntilChanged((a, b) => a.range === b.range && a.namespace === b.namespace),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly trigger$ = combineLatest([this.filters$, this.refresh.trigger$]).pipe(map(([filters]) => filters));

  readonly summary$ = loadOnTrigger(this.trigger$, (f) => this.analysis.summary(f)).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  readonly failures$ = loadOnTrigger(this.trigger$, (f) => this.analysis.failures(f)).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  readonly analyses$ = loadOnTrigger(this.refresh.trigger$, () => this.analysis.recentAnalyses()).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly recentAnalyses$ = this.analyses$.pipe(map((state) => ({ ...state, data: state.data?.items ?? null })));

  readonly breakdown$ = this.failures$.pipe(map((state) => (state.data ? this.analysis.breakdown(state.data) : null)));
  readonly recent$ = this.failures$.pipe(map((state) => state.data?.taskRuns.slice(0, RECENT_LIMIT) ?? null));
  readonly namespaces$ = this.collector.namespaces$;


  readonly recentColumns: TableColumn<TaskRun>[] = [
    {
      key: 'taskRunName',
      header: 'Task run',
      kind: 'primary',
      value: (t) => t.taskName ?? t.taskRunName,
      secondary: (t) => t.pipelineRunName ?? t.taskRunName,
    },
    { key: 'failureReason', header: 'Failure', value: (t) => t.failureReason ?? 'Failed', secondary: (t) => t.failureMessage },
    { key: 'namespace', header: 'Namespace', kind: 'mono', value: (t) => t.namespace, hideBelow: 'lg' },
    { key: 'startTime', header: 'Started', kind: 'datetime', value: (t) => t.startTime },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly analysis: FailureAnalysisService,
    private readonly refresh: RefreshService,
    private readonly preferences: PreferencesService,
    private readonly collector: CollectorStatusStore,
  ) {}

  setRange(range: TimeRangePreset): void {
    this.updateQuery({ range });
  }

  setNamespace(namespace: string | null): void {
    this.updateQuery({ namespace });
  }

  openTask(task: TaskRun): void {
    void this.router.navigate(['/task-runs', task.id]);
  }

  reload(): void {
    this.refresh.refresh();
  }

  readonly rowLabel = (task: TaskRun): string => `Open the failure analysis of TaskRun ${task.taskRunName}`;

  private updateQuery(params: Partial<Record<'range' | 'namespace', string | null>>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
