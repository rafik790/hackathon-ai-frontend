import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import {
  PageRequest,
  PageResponse,
  PipelineRun,
  PipelineRunFilter,
  PipelineRunSortField,
  TaskRun,
} from '../models/execution.models';
import { toHttpParams } from '../utils/http-params.util';

/** GET /api/v1/pipelines, /api/v1/pipelines/{id} and /api/v1/pipelines/{id}/tasks. */
@Injectable({ providedIn: 'root' })
export class PipelineRunApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = joinUrl(config.apiBaseUrl, 'pipelines');
  }

  list(filter: PipelineRunFilter, page: PageRequest<PipelineRunSortField>): Observable<PageResponse<PipelineRun>> {
    return this.http.get<PageResponse<PipelineRun>>(this.baseUrl, {
      params: toHttpParams({
        namespace: filter.namespace,
        pipelineName: filter.pipelineName,
        status: filter.status,
        from: filter.from,
        to: filter.to,
        page: page.page,
        size: page.size,
        sort: `${page.sort},${page.direction}`,
      }),
    });
  }

  get(id: number): Observable<PipelineRun> {
    return this.http.get<PipelineRun>(joinUrl(this.baseUrl, String(id)));
  }

  /** TaskRuns belonging to a PipelineRun, ordered by start time. */
  tasks(id: number): Observable<readonly TaskRun[]> {
    return this.http.get<readonly TaskRun[]>(joinUrl(this.baseUrl, `${id}/tasks`));
  }
}
