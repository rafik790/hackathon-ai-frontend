import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { PageRequest, PipelineRun, PipelineRunSortField } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { RefreshService } from '../../../../core/services/refresh.service';
import { RowActionEvent } from '../../../../shared/components/data-table/data-table.models';
import { OPEN_DETAILS_ACTION, VIEW_TASKS_ACTION, isFailed, pipelineRunColumns } from '../../../../shared/execution/execution-columns';
import { DashboardFilters } from '../../models/dashboard-view.models';
import { DashboardService } from '../../services/dashboard.service';

const SORTABLE: readonly PipelineRunSortField[] = ['pipelineRunName', 'pipelineName', 'namespace', 'status', 'startTime', 'completionTime', 'durationMs'];

/** Recent PipelineRuns inside the Overview window, with server-side paging and sorting. */
@Component({
  selector: 'app-recent-pipeline-runs',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-pipeline-runs.component.html',
})
export class RecentPipelineRunsComponent implements OnChanges {
  @Input({ required: true }) filters!: DashboardFilters;

  readonly columns = pipelineRunColumns({ compact: true });
  readonly actions = [OPEN_DETAILS_ACTION, VIEW_TASKS_ACTION];
  readonly isFailed = isFailed;

  private readonly filters$ = new BehaviorSubject<DashboardFilters | null>(null);
  private readonly page$ = new BehaviorSubject<PageRequest<PipelineRunSortField>>({ page: 0, size: 8, sort: 'startTime', direction: 'desc' });

  readonly state$ = loadOnTrigger(
    combineLatest([this.filters$, this.page$, this.refresh.trigger$]).pipe(map(([filters, page]) => ({ filters, page }))),
    ({ filters, page }) => this.dashboard.recentPipelineRuns(filters ?? { range: '7d', namespace: null }, page),
  );
  readonly pageRequest$ = this.page$.asObservable();

  constructor(private readonly dashboard: DashboardService, private readonly refresh: RefreshService, private readonly router: Router) {}

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

  readonly rowLabel = (run: PipelineRun): string => `Open PipelineRun ${run.pipelineRunName}`;
}
