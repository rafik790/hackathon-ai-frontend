import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary, TrendResponse } from '../../../core/models/dashboard.models';
import { PageRequest, PageResponse, PipelineRun, PipelineRunSortField, TaskRun, TaskRunSortField } from '../../../core/models/execution.models';
import { DashboardApiService } from '../../../core/services/dashboard-api.service';
import { PipelineRunApiService } from '../../../core/services/pipeline-run-api.service';
import { TaskRunApiService } from '../../../core/services/task-run-api.service';
import { formatDuration } from '../../../shared/utils/duration';
import { rangeStart } from '../../../shared/execution/list-query';
import { DashboardFilters, KpiView } from '../models/dashboard-view.models';

/** Overview data access and view-model derivation. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardApi: DashboardApiService,
    private readonly pipelineApi: PipelineRunApiService,
    private readonly taskApi: TaskRunApiService,
  ) {}

  summary(filters: DashboardFilters): Observable<DashboardSummary> {
    return this.dashboardApi.summary(filters);
  }

  trends(filters: DashboardFilters): Observable<TrendResponse> {
    return this.dashboardApi.trends(filters);
  }

  /** PipelineRuns started inside the selected window. */
  recentPipelineRuns(filters: DashboardFilters, page: PageRequest<PipelineRunSortField>): Observable<PageResponse<PipelineRun>> {
    return this.pipelineApi.list(
      { namespace: filters.namespace, from: rangeStart(filters.range) },
      page,
    );
  }

  /** TaskRuns started inside the selected window. */
  recentTaskRuns(filters: DashboardFilters, page: PageRequest<TaskRunSortField>): Observable<PageResponse<TaskRun>> {
    return this.taskApi.list(
      { namespace: filters.namespace, from: rangeStart(filters.range) },
      page,
    );
  }

  /** KPI tiles; every value comes straight from the summary, nothing is extrapolated. */
  kpis(summary: DashboardSummary | null, filters: DashboardFilters): KpiView[] {
    const ns: Record<string, string> = filters.namespace ? { namespace: filters.namespace } : {};
    const withStatus = (status: string): Record<string, string> => ({ ...ns, status });
    const completed = summary ? summary.successfulExecutions + summary.failedExecutions : 0;
    return [
      {
        id: 'total',
        label: 'Total pipeline runs',
        value: summary ? summary.totalExecutions.toLocaleString() : null,
        icon: 'account_tree',
        tone: 'primary',
        caption: summary ? `${completed.toLocaleString()} completed · avg ${formatDuration(summary.averageDurationMs)}` : null,
        link: '/pipeline-runs',
        queryParams: Object.keys(ns).length ? ns : null,
      },
      {
        id: 'succeeded',
        label: 'Successful',
        value: summary ? summary.successfulExecutions.toLocaleString() : null,
        icon: 'check_circle',
        tone: 'success',
        caption: summary ? (completed ? `${summary.successRate.toFixed(1)}% success rate` : 'No completed runs') : null,
        link: '/pipeline-runs',
        queryParams: withStatus('succeeded'),
      },
      {
        id: 'failed',
        label: 'Failed',
        value: summary ? summary.failedExecutions.toLocaleString() : null,
        icon: 'cancel',
        tone: 'danger',
        caption: summary ? (completed ? `${summary.failureRate.toFixed(1)}% failure rate` : 'No completed runs') : null,
        link: '/pipeline-runs',
        queryParams: withStatus('failed'),
      },
      {
        id: 'running',
        label: 'Running',
        value: summary ? summary.runningExecutions.toLocaleString() : null,
        icon: 'sync',
        tone: 'info',
        caption: summary
          ? summary.unknownExecutions
            ? `${summary.unknownExecutions.toLocaleString()} with unknown status`
            : 'Currently in progress'
          : null,
        link: '/pipeline-runs',
        queryParams: withStatus('running'),
      },
      {
        id: 'tasks',
        label: 'Total task runs',
        value: summary ? summary.totalTaskRuns.toLocaleString() : null,
        icon: 'checklist',
        tone: 'neutral',
        caption: summary ? 'Across all pipeline runs' : null,
        link: '/task-runs',
        queryParams: Object.keys(ns).length ? ns : null,
      },
      {
        id: 'failedTasks',
        label: 'Failed task runs',
        value: summary ? summary.failedTaskRuns.toLocaleString() : null,
        icon: 'report',
        tone: 'warning',
        caption: summary ? `${summary.taskFailureRate.toFixed(1)}% task failure rate` : null,
        link: '/task-runs',
        queryParams: withStatus('failed'),
      },
    ];
  }
}
