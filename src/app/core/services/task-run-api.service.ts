import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import { PageRequest, PageResponse, TaskRun, TaskRunFilter, TaskRunSortField } from '../models/execution.models';
import { toHttpParams } from '../utils/http-params.util';

/** GET /api/v1/tasks and /api/v1/tasks/{id}. */
@Injectable({ providedIn: 'root' })
export class TaskRunApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = joinUrl(config.apiBaseUrl, 'tasks');
  }

  list(filter: TaskRunFilter, page: PageRequest<TaskRunSortField>): Observable<PageResponse<TaskRun>> {
    return this.http.get<PageResponse<TaskRun>>(this.baseUrl, {
      params: toHttpParams({
        namespace: filter.namespace,
        pipelineName: filter.pipelineName,
        pipelineRunName: filter.pipelineRunName,
        taskName: filter.taskName,
        status: filter.status,
        from: filter.from,
        to: filter.to,
        page: page.page,
        size: page.size,
        sort: `${page.sort},${page.direction}`,
      }),
    });
  }

  get(id: number): Observable<TaskRun> {
    return this.http.get<TaskRun>(joinUrl(this.baseUrl, String(id)));
  }
}
