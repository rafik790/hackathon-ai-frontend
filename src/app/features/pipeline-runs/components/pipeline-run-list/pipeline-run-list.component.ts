import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, shareReplay } from 'rxjs';
import { PipelineRun, PipelineRunSortField } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { RefreshService } from '../../../../core/services/refresh.service';
import { RowActionEvent } from '../../../../shared/components/data-table/data-table.models';
import { ExecutionFilterValue } from '../../../../shared/components/filter-bar/filter-bar.component';
import { OPEN_DETAILS_ACTION, VIEW_TASKS_ACTION, isFailed, pipelineRunColumns } from '../../../../shared/execution/execution-columns';
import {
  ListQueryState,
  filterValueOf,
  listQueryToParams,
  parseListQuery,
  withFilter,
  withSort,
} from '../../../../shared/execution/list-query';
import {
  PIPELINE_RUN_DEFAULT_SORT,
  PIPELINE_RUN_QUERY_KEYS,
  PIPELINE_RUN_SORTABLE,
  PipelineRunsService,
} from '../../services/pipeline-runs.service';

@Component({
  selector: 'app-pipeline-run-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pipeline-run-list.component.html',
})
export class PipelineRunListComponent {
  readonly columns = pipelineRunColumns();
  readonly actions = [OPEN_DETAILS_ACTION, VIEW_TASKS_ACTION];
  readonly isFailed = isFailed;

  /** Filters, page and sort are read from the URL, so views are shareable and survive refresh. */
  readonly query$ = this.route.queryParamMap.pipe(
    map((params) => parseListQuery(params, PIPELINE_RUN_QUERY_KEYS, PIPELINE_RUN_SORTABLE, PIPELINE_RUN_DEFAULT_SORT)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly filterValue$ = this.query$.pipe(map(filterValueOf));
  readonly state$ = loadOnTrigger(
    combineLatest([this.query$, this.refresh.trigger$]).pipe(map(([query]) => query)),
    (query) => this.pipelineRuns.list(query),
  );
  readonly namespaces$ = this.collector.namespaces$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pipelineRuns: PipelineRunsService,
    private readonly refresh: RefreshService,
    private readonly collector: CollectorStatusStore,
  ) {}

  onFilter(query: ListQueryState<PipelineRunSortField>, value: ExecutionFilterValue): void {
    this.navigate(withFilter(query, value));
  }

  onSort(query: ListQueryState<PipelineRunSortField>, sort: Sort): void {
    this.navigate(withSort(query, sort, PIPELINE_RUN_SORTABLE));
  }

  onPage(query: ListQueryState<PipelineRunSortField>, event: PageEvent): void {
    this.navigate({ ...query, page: event.pageSize !== query.size ? 0 : event.pageIndex, size: event.pageSize });
  }

  open(run: PipelineRun): void {
    void this.router.navigate([run.id], { relativeTo: this.route });
  }

  onAction(event: RowActionEvent<PipelineRun>): void {
    if (event.actionId === VIEW_TASKS_ACTION.id) {
      void this.router.navigate(['/task-runs'], {
        queryParams: { pipelineRunName: event.row.pipelineRunName, namespace: event.row.namespace },
      });
    } else {
      this.open(event.row);
    }
  }

  reload(): void {
    this.refresh.refresh();
  }

  readonly rowLabel = (run: PipelineRun): string => `Open PipelineRun ${run.pipelineRunName}`;

  private navigate(query: ListQueryState<PipelineRunSortField>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: listQueryToParams(query, PIPELINE_RUN_QUERY_KEYS, PIPELINE_RUN_DEFAULT_SORT),
    });
  }
}
