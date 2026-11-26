import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import { PageRequest, PageResponse } from '../models/execution.models';
import {
  FailureAnalysis,
  FailureAnalysisFilter,
  FailureAnalysisSortField,
  FailureAnalysisSummary,
} from '../models/failure-analysis.models';
import { toHttpParams } from '../utils/http-params.util';

/** GET /api/v1/failure-analyses, GET /api/v1/tasks/{id}/analysis and POST /api/v1/failure-evidence/{id}/analyse. */
@Injectable({ providedIn: 'root' })
export class FailureAnalysisApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = config.apiBaseUrl;
  }

  list(filter: FailureAnalysisFilter, page: PageRequest<FailureAnalysisSortField>): Observable<PageResponse<FailureAnalysisSummary>> {
    return this.http.get<PageResponse<FailureAnalysisSummary>>(joinUrl(this.baseUrl, 'failure-analyses'), {
      params: toHttpParams({
        category: filter.category,
        severity: filter.severity,
        status: filter.status,
        page: page.page,
        size: page.size,
        sort: `${page.sort},${page.direction}`,
      }),
    });
  }

  get(id: number): Observable<FailureAnalysis> {
    return this.http.get<FailureAnalysis>(joinUrl(this.baseUrl, `failure-analyses/${id}`));
  }

  /** Newest analysis of the last attempt of a TaskRun; 404 when there is none. */
  latestOfTaskRun(taskRunId: number): Observable<FailureAnalysis> {
    return this.http.get<FailureAnalysis>(joinUrl(this.baseUrl, `tasks/${taskRunId}/analysis`));
  }

  /**
   * Queues an analysis. The 202 response is the queued analysis, which is processed later. 409 when it cannot be
   * requested, 429 when the daily AI quota is exhausted.
   *
   * @param force analyse evidence again although it was analysed; creates a new revision and uses AI quota
   */
  request(failureEvidenceId: number, force = false): Observable<FailureAnalysis> {
    return this.http.post<FailureAnalysis>(joinUrl(this.baseUrl, `failure-evidence/${failureEvidenceId}/analyse`), null, {
      params: toHttpParams({ force: force ? true : null }),
    });
  }
}
