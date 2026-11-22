import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { DashboardSummary, TrendResponse } from '../../../core/models/dashboard.models';
import { MAX_PAGE_SIZE } from '../../../core/models/execution.models';
import { DashboardApiService } from '../../../core/services/dashboard-api.service';
import { PipelineRunApiService } from '../../../core/services/pipeline-run-api.service';
import { TaskRunApiService } from '../../../core/services/task-run-api.service';
import { BarItem } from '../../../shared/charts/bar-list-chart.component';
import { rangeStart } from '../../../shared/execution/list-query';
import { FailureBreakdown, FailureFilters, FailureSample } from '../models/failure-analysis.models';

const TOP_N = 6;

/**
 * Failure analysis from the data the backend actually exposes: aggregate counts and trends from
 * the dashboard endpoints, and failure reasons from the most recent failed executions.
 * No AI analysis is produced here; the backend does not offer it yet.
 */
@Injectable()
export class FailureAnalysisService {
  constructor(
    private readonly dashboardApi: DashboardApiService,
    private readonly pipelineApi: PipelineRunApiService,
    private readonly taskApi: TaskRunApiService,
  ) {}

  summary(filters: FailureFilters): Observable<DashboardSummary> {
    return this.dashboardApi.summary(filters);
  }

  trends(filters: FailureFilters): Observable<TrendResponse> {
    return this.dashboardApi.trends(filters);
  }

  /** Most recent failed PipelineRuns and TaskRuns in the window (one page of up to 100 each). */
  failures(filters: FailureFilters): Observable<FailureSample> {
    const filter = { namespace: filters.namespace, status: 'FAILED' as const, from: rangeStart(filters.range) };
    const page = { page: 0, size: MAX_PAGE_SIZE, direction: 'desc' as const };
    return forkJoin({
      pipelines: this.pipelineApi.list(filter, { ...page, sort: 'startTime' }),
      tasks: this.taskApi.list(filter, { ...page, sort: 'startTime' }),
    }).pipe(
      map(({ pipelines, tasks }) => ({
        pipelineRuns: pipelines.content,
        pipelineRunTotal: pipelines.totalElements,
        taskRuns: tasks.content,
        taskRunTotal: tasks.totalElements,
      })),
    );
  }

  breakdown(sample: FailureSample): FailureBreakdown {
    return {
      byPipeline: topCounts(sample.pipelineRuns.map((r) => r.pipelineName ?? '(no pipeline name)')),
      byTask: topCounts(sample.taskRuns.map((t) => t.taskName ?? t.taskRunName)),
      byReason: topCounts(sample.taskRuns.map((t) => t.failureReason || 'No reason reported')),
      truncated: sample.pipelineRunTotal > sample.pipelineRuns.length || sample.taskRunTotal > sample.taskRuns.length,
      sampledPipelineRuns: sample.pipelineRuns.length,
      sampledTaskRuns: sample.taskRuns.length,
    };
  }
}

export function topCounts(values: readonly string[], limit = TOP_N): BarItem[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}
