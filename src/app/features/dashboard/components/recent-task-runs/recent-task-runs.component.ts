import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { PageRequest, TaskRun, TaskRunSortField } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { RefreshService } from '../../../../core/services/refresh.service';
import { OPEN_DETAILS_ACTION, isFailed, taskRunColumns } from '../../../../shared/execution/execution-columns';
import { DashboardFilters } from '../../models/dashboard-view.models';
import { DashboardService } from '../../services/dashboard.service';

const SORTABLE: readonly TaskRunSortField[] = ['taskRunName', 'taskName', 'namespace', 'status', 'startTime', 'completionTime', 'durationMs'];

/** Recent TaskRuns inside the Overview window, with server-side paging and sorting. */
@Component({
  selector: 'app-recent-task-runs',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-task-runs.component.html',
})
export class RecentTaskRunsComponent implements OnChanges {
  @Input({ required: true }) filters!: DashboardFilters;

  readonly columns = taskRunColumns({ compact: true });
  readonly actions = [OPEN_DETAILS_ACTION];
  readonly isFailed = isFailed;

  private readonly filters$ = new BehaviorSubject<DashboardFilters | null>(null);
  private readonly page$ = new BehaviorSubject<PageRequest<TaskRunSortField>>({ page: 0, size: 8, sort: 'startTime', direction: 'desc' });

  readonly state$ = loadOnTrigger(
    combineLatest([this.filters$, this.page$, this.refresh.trigger$]).pipe(map(([filters, page]) => ({ filters, page }))),
    ({ filters, page }) => this.dashboard.recentTaskRuns(filters ?? { range: '7d', namespace: null }, page),
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
    const active = sort.active as TaskRunSortField;
    if (SORTABLE.includes(active) && sort.direction) {
      this.page$.next({ ...this.page$.value, page: 0, sort: active, direction: sort.direction });
    }
  }

  open(task: TaskRun): void {
    void this.router.navigate(['/task-runs', task.id]);
  }

  retry(): void {
    this.refresh.refresh();
  }

  readonly rowLabel = (task: TaskRun): string => `Open TaskRun ${task.taskRunName}`;
}
