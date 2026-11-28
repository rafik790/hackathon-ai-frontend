import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, of, shareReplay, switchMap } from 'rxjs';
import { PageRequest, PipelineRun, PipelineRunSortField } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { RefreshService } from '../../../../core/services/refresh.service';
import { RowActionEvent } from '../../../../shared/components/data-table/data-table.models';
import { OPEN_DETAILS_ACTION, VIEW_TASKS_ACTION, pipelineRunColumns } from '../../../../shared/execution/execution-columns';
import { ResolutionLookupService, resolutionColumn } from '../../../../shared/resolution/resolution-lookup.service';
import { DashboardFilters } from '../../models/dashboard-view.models';
import { DashboardService } from '../../services/dashboard.service';

const SORTABLE: readonly PipelineRunSortField[] = ['pipelineRunName', 'pipelineName', 'namespace', 'startTime', 'completionTime', 'durationMs'];

/** Recent failed PipelineRuns inside the Overview window, with server-side paging and sorting. */
@Component({
  selector: 'app-recent-pipeline-runs',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-pipeline-runs.component.html',
})
export class RecentPipelineRunsComponent implements OnChanges {
  @Input({ required: true }) filters!: DashboardFilters;

  // Every row has failed: the reason says more than the status.
  readonly columns = [
    ...pipelineRunColumns({ compact: true }).map((c) =>
      c.key === 'status' ? { key: 'failureReason', header: 'Failure', value: (r: PipelineRun) => r.failureReason ?? 'Failed', secondary: (r: PipelineRun) => r.failureMessage } : c,
    ),
    // Derived from the failed TaskRuns and read-only.
    resolutionColumn<PipelineRun>('Resolution'),
  ];
  readonly actions = [OPEN_DETAILS_ACTION, VIEW_TASKS_ACTION];

  private readonly filters$ = new BehaviorSubject<DashboardFilters | null>(null);
  private readonly page$ = new BehaviorSubject<PageRequest<PipelineRunSortField>>({ page: 0, size: 8, sort: 'startTime', direction: 'desc' });

  readonly state$ = loadOnTrigger(
    combineLatest([this.filters$, this.page$, this.refresh.trigger$]).pipe(map(([filters, page]) => ({ filters, page }))),
    ({ filters, page }) => this.dashboard.recentFailedPipelineRuns(filters ?? { range: '7d', namespace: null }, page),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  /** The page with the derived resolution of each PipelineRun, read with one batch request per load. */
  readonly rows$ = this.state$.pipe(
    map((state) => state.data?.content ?? null),
    distinctUntilChanged(),
    switchMap((rows) => (rows ? this.resolutions.attach('PIPELINE_RUN', rows) : of(null))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly pageRequest$ = this.page$.asObservable();

  constructor(
    private readonly dashboard: DashboardService,
    private readonly refresh: RefreshService,
    private readonly router: Router,
    private readonly resolutions: ResolutionLookupService,
  ) {}

  ngOnChanges(): void {
    this.page$.next({ ...this.page$.value, page: 0 });
    this.filters$.next(this.filters);
  }

  onPage(event: PageEvent): void {
    this.page$.next({ ...this.page$.value, page: event.pageIndex, size: event.pageSize });
  }

  onSort(sort: Sort): void {
    const active = sort.active as PipelineRunSortField;
    if (SORTABLE.includes(active) && sort.direction) {
      this.page$.next({ ...this.page$.value, page: 0, sort: active, direction: sort.direction });
    }
  }

  open(run: PipelineRun): void {
    void this.router.navigate(['/pipeline-runs', run.id]);
  }

  onAction(event: RowActionEvent<PipelineRun>): void {
    if (event.actionId === VIEW_TASKS_ACTION.id) {
      void this.router.navigate(['/task-runs'], { queryParams: { pipelineRunName: event.row.pipelineRunName, namespace: event.row.namespace } });
    } else {
      this.open(event.row);
    }
  }

  retry(): void {
    this.refresh.refresh();
  }

  readonly rowLabel = (run: PipelineRun): string => `Open failed PipelineRun ${run.pipelineRunName}`;
}
