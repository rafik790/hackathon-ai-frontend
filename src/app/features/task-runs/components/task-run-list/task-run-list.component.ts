import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, shareReplay } from 'rxjs';
import { TaskRun, TaskRunSortField } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { RefreshService } from '../../../../core/services/refresh.service';
import { ExecutionFilterValue } from '../../../../shared/components/filter-bar/filter-bar.component';
import { OPEN_DETAILS_ACTION, isFailed, taskRunColumns } from '../../../../shared/execution/execution-columns';
import {
  ListQueryState,
  filterValueOf,
  listQueryToParams,
  parseListQuery,
  withFilter,
  withSort,
} from '../../../../shared/execution/list-query';
import { TASK_RUN_DEFAULT_SORT, TASK_RUN_QUERY_KEYS, TASK_RUN_SORTABLE, TaskRunsService } from '../../services/task-runs.service';

@Component({
  selector: 'app-task-run-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-run-list.component.html',
})
export class TaskRunListComponent {
  readonly columns = taskRunColumns();
  readonly actions = [OPEN_DETAILS_ACTION];
  readonly isFailed = isFailed;

  readonly query$ = this.route.queryParamMap.pipe(
    map((params) => parseListQuery(params, TASK_RUN_QUERY_KEYS, TASK_RUN_SORTABLE, TASK_RUN_DEFAULT_SORT)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly filterValue$ = this.query$.pipe(map(filterValueOf));
  readonly state$ = loadOnTrigger(
    combineLatest([this.query$, this.refresh.trigger$]).pipe(map(([query]) => query)),
    (query) => this.taskRuns.list(query),
  );
  readonly namespaces$ = this.collector.namespaces$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly taskRuns: TaskRunsService,
    private readonly refresh: RefreshService,
    private readonly collector: CollectorStatusStore,
  ) {}

  onFilter(query: ListQueryState<TaskRunSortField>, value: ExecutionFilterValue): void {
    this.navigate(withFilter(query, value));
  }

  onSort(query: ListQueryState<TaskRunSortField>, sort: Sort): void {
    this.navigate(withSort(query, sort, TASK_RUN_SORTABLE));
  }

  onPage(query: ListQueryState<TaskRunSortField>, event: PageEvent): void {
    this.navigate({ ...query, page: event.pageSize !== query.size ? 0 : event.pageIndex, size: event.pageSize });
  }

  open(task: TaskRun): void {
    void this.router.navigate([task.id], { relativeTo: this.route });
  }

  reload(): void {
    this.refresh.refresh();
  }

  readonly rowLabel = (task: TaskRun): string => `Open TaskRun ${task.taskRunName}`;

  private navigate(query: ListQueryState<TaskRunSortField>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: listQueryToParams(query, TASK_RUN_QUERY_KEYS, TASK_RUN_DEFAULT_SORT),
    });
  }
}
