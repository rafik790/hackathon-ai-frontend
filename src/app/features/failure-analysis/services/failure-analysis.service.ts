import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardSummary } from '../../../core/models/dashboard.models';
import { MAX_PAGE_SIZE } from '../../../core/models/execution.models';
import { DashboardApiService } from '../../../core/services/dashboard-api.service';
import { FailureAnalysisApiService } from '../../../core/services/failure-analysis-api.service';
import { TaskRunApiService } from '../../../core/services/task-run-api.service';
import { rangeStart } from '../../../shared/execution/list-query';
import { CountItem, FailureBreakdown, FailureFilters, FailureSample, RecentAnalyses } from '../models/failure-analysis.models';

const TOP_N = 6;
const RECENT_ANALYSES = 5;

/**
 * Failures of a time window from the data the backend exposes: counts from the dashboard summary, the most recent
 * failed TaskRuns, and the newest AI analyses. No analysis is produced in the browser.
 */
@Injectable()
export class FailureAnalysisService {
  constructor(
    private readonly dashboardApi: DashboardApiService,
    private readonly taskApi: TaskRunApiService,
    private readonly analysisApi: FailureAnalysisApiService,
  ) {}

  summary(filters: FailureFilters): Observable<DashboardSummary> {
    return this.dashboardApi.summary(filters);
  }

  /** Most recent failed TaskRuns in the window (one page of up to 100). */
  failures(filters: FailureFilters): Observable<FailureSample> {
    return this.taskApi
      .list(
        { namespace: filters.namespace, status: 'FAILED', from: rangeStart(filters.range) },
        { page: 0, size: MAX_PAGE_SIZE, sort: 'startTime', direction: 'desc' },
      )
      .pipe(map((page) => ({ taskRuns: page.content, taskRunTotal: page.totalElements })));
  }

  /** The API has no namespace or time filter for analyses. */
  recentAnalyses(): Observable<RecentAnalyses> {
    return this.analysisApi
      .list({}, { page: 0, size: RECENT_ANALYSES, sort: 'createdAt', direction: 'desc' })
      .pipe(map((page) => ({ items: page.content, total: page.totalElements })));
  }

  breakdown(sample: FailureSample): FailureBreakdown {
    return {
      byTask: topCounts(sample.taskRuns.map((t) => t.taskName ?? t.taskRunName)),
      byReason: topCounts(sample.taskRuns.map((t) => t.failureReason || 'No reason reported')),
      truncated: sample.taskRunTotal > sample.taskRuns.length,
      sampledTaskRuns: sample.taskRuns.length,
    };
  }
}

export function topCounts(values: readonly string[], limit = TOP_N): CountItem[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}
