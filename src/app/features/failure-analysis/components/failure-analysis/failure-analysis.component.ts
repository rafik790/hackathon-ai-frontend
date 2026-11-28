import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, of, shareReplay, switchMap } from 'rxjs';
import { TimeRangePreset, parseTimeRangePreset } from '../../../../core/models/dashboard.models';
import { TaskRun } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { PreferencesService } from '../../../../core/services/preferences.service';
import { RefreshService } from '../../../../core/services/refresh.service';
import { ResolutionStatus } from '../../../../core/models/resolution.models';
import { TableColumn } from '../../../../shared/components/data-table/data-table.models';
import { ResolutionLookupService, WithResolution, resolutionColumn } from '../../../../shared/resolution/resolution-lookup.service';
import { FailureFilters } from '../../models/failure-analysis.models';
import { FailureAnalysisService } from '../../services/failure-analysis.service';

const RECENT_LIMIT = 10;

/** Read-only resolution counts of the window's failed TaskRuns, most to least urgent work. */
export interface ResolutionCard {
  readonly status: ResolutionStatus;
  readonly label: string;
  readonly icon: string;
  readonly tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
}

export const RESOLUTION_CARDS: readonly ResolutionCard[] = [
  { status: 'OPEN', label: 'Open', icon: 'flag', tone: 'neutral' },
  { status: 'INVESTIGATING', label: 'Investigating', icon: 'manage_search', tone: 'info' },
  { status: 'FIX_IN_PROGRESS', label: 'Fix in progress', icon: 'construction', tone: 'warning' },
  { status: 'RESOLVED', label: 'Resolved', icon: 'task_alt', tone: 'success' },
  { status: 'REOPENED', label: 'Reopened', icon: 'replay', tone: 'danger' },
];

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
  /** The recent failures with their resolution, read with one batch request per load; reloaded with every refresh. */
  readonly recentRows$ = this.failures$.pipe(
    // The same data is emitted again while a refresh loads; only new data needs new resolutions.
    map((state) => state.data),
    distinctUntilChanged(),
    switchMap((data) => (data ? this.resolutions.attach('TASK_RUN', data.taskRuns.slice(0, RECENT_LIMIT)) : of(null))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly resolutionCards = RESOLUTION_CARDS;
  readonly namespaces$ = this.collector.namespaces$;


  readonly recentColumns: TableColumn<WithResolution<TaskRun>>[] = [
    {
      key: 'taskRunName',
      header: 'Task run',
      kind: 'primary',
      value: (t) => t.taskName ?? t.taskRunName,
      secondary: (t) => t.pipelineRunName ?? t.taskRunName,
    },
    { key: 'failureReason', header: 'Failure', value: (t) => t.failureReason ?? 'Failed', secondary: (t) => t.failureMessage },
    // Read-only: the resolution is changed on the TaskRun page.
    resolutionColumn<TaskRun>(),
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
    private readonly resolutions: ResolutionLookupService,
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

  readonly rowLabel = (task: TaskRun): string => `Open TaskRun ${task.taskRunName} to see its failure analysis and resolution`;

  /** Share of the failed TaskRuns, for the card captions. */
  share(count: number | undefined, total: number | undefined): string | null {
    return count === undefined || !total ? null : `${Math.round((count / total) * 100)}% of failed task runs`;
  }

  private updateQuery(params: Partial<Record<'range' | 'namespace', string | null>>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
