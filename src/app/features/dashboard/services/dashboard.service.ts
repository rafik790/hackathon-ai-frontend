import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary, TrendResponse } from '../../../core/models/dashboard.models';
import { PageRequest, PageResponse, PipelineRun, PipelineRunSortField } from '../../../core/models/execution.models';
import { DashboardApiService } from '../../../core/services/dashboard-api.service';
import { PipelineRunApiService } from '../../../core/services/pipeline-run-api.service';
import { formatDuration } from '../../../shared/utils/duration';
import { rangeStart } from '../../../shared/execution/list-query';
import { DashboardFilters, KpiView } from '../models/dashboard-view.models';

/** Overview data access and view-model derivation. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardApi: DashboardApiService,
    private readonly pipelineApi: PipelineRunApiService,
  ) {}

  summary(filters: DashboardFilters): Observable<DashboardSummary> {
    return this.dashboardApi.summary(filters);
  }

  trends(filters: DashboardFilters): Observable<TrendResponse> {
    return this.dashboardApi.trends(filters);
  }

  /** Failed PipelineRuns started inside the selected window. */
  recentFailedPipelineRuns(filters: DashboardFilters, page: PageRequest<PipelineRunSortField>): Observable<PageResponse<PipelineRun>> {
    return this.pipelineApi.list({ namespace: filters.namespace, status: 'FAILED', from: rangeStart(filters.range) }, page);
  }

  /** Four tiles, each with its own metric; every value comes straight from the summary. */
  kpis(summary: DashboardSummary | null, filters: DashboardFilters): KpiView[] {
    const ns: Record<string, string> = filters.namespace ? { namespace: filters.namespace } : {};
    const failed = { ...ns, status: 'failed' };
    const completed = summary ? summary.successfulExecutions + summary.failedExecutions : 0;
    return [
      {
        id: 'success',
        label: 'Success rate',
        value: summary ? (completed ? `${summary.successRate.toFixed(1)}%` : '—') : null,
        icon: 'check_circle',
        tone: 'success',
        caption: summary
          ? `${summary.successfulExecutions.toLocaleString()} of ${completed.toLocaleString()} completed pipeline runs`
          : null,
        link: '/pipeline-runs',
        queryParams: Object.keys(ns).length ? ns : null,
      },
      {
        id: 'failed',
        label: 'Failed pipeline runs',
        value: summary ? summary.failedExecutions.toLocaleString() : null,
        icon: 'cancel',
        tone: 'danger',
        caption: summary ? (completed ? `${summary.failureRate.toFixed(1)}% failure rate` : 'No completed runs') : null,
        link: '/pipeline-runs',
        queryParams: failed,
      },
      {
        id: 'failedTasks',
        label: 'Failed task runs',
        value: summary ? summary.failedTaskRuns.toLocaleString() : null,
        icon: 'report',
        tone: 'warning',
        caption: summary ? `${summary.taskFailureRate.toFixed(1)}% of ${summary.totalTaskRuns.toLocaleString()} task runs` : null,
        link: '/task-runs',
        queryParams: failed,
      },
      {
        id: 'duration',
        label: 'Average duration',
        value: summary ? formatDuration(summary.averageDurationMs) : null,
        icon: 'timer',
        tone: 'neutral',
        caption: summary ? `P95 ${formatDuration(summary.p95DurationMs)} · ${summary.runningExecutions.toLocaleString()} running now` : null,
        link: null,
        queryParams: null,
      },
    ];
  }
}
