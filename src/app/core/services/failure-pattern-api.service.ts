import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import { PageResponse } from '../models/execution.models';
import { PatternAnalysis, StartPatternAnalysisRequest } from '../models/failure-pattern.models';
import { toHttpParams } from '../utils/http-params.util';

/** /api/v1/failure-pattern-analyses: start, read and list failure pattern analyses. */
@Injectable({ providedIn: 'root' })
export class FailurePatternApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = joinUrl(config.apiBaseUrl, 'failure-pattern-analyses');
  }

  /**
   * Queues an analysis; the 202 response is the queued one, or the running one for the same period.
   * 400 invalid period or range, 409 another analysis running or feature disabled, 429 AI quota exhausted.
   */
  start(request: StartPatternAnalysisRequest): Observable<PatternAnalysis> {
    return this.http.post<PatternAnalysis>(this.baseUrl, request);
  }

  /** With the report. */
  get(id: number): Observable<PatternAnalysis> {
    return this.http.get<PatternAnalysis>(joinUrl(this.baseUrl, String(id)));
  }

  /** Newest first, without reports. */
  list(size = 10): Observable<PageResponse<PatternAnalysis>> {
    return this.http.get<PageResponse<PatternAnalysis>>(this.baseUrl, {
      params: toHttpParams({ page: 0, size, sort: 'createdAt,desc' }),
    });
  }
}
