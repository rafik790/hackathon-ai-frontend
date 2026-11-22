import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import { DashboardQuery, DashboardSummary, TrendQuery, TrendResponse } from '../models/dashboard.models';
import { toHttpParams } from '../utils/http-params.util';
import { AppEnvironment } from '../../../environments/environment.model';

/** GET /api/v1/dashboard/summary and /api/v1/dashboard/trends. */
@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = joinUrl(config.apiBaseUrl, 'dashboard');
  }

  summary(query: DashboardQuery): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(joinUrl(this.baseUrl, 'summary'), {
      params: toHttpParams({ range: query.range, namespace: query.namespace, pipelineName: query.pipelineName }),
    });
  }

  trends(query: TrendQuery): Observable<TrendResponse> {
    return this.http.get<TrendResponse>(joinUrl(this.baseUrl, 'trends'), {
      params: toHttpParams({
        range: query.range,
        namespace: query.namespace,
        pipelineName: query.pipelineName,
        granularity: query.granularity?.toLowerCase(),
      }),
    });
  }
}
