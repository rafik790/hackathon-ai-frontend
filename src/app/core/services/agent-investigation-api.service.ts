import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import {
  AgentInvestigation,
  AgentInvestigationFilter,
  AgentInvestigationStep,
  StartInvestigationRequest,
} from '../models/agent-investigation.models';
import { PageResponse } from '../models/execution.models';
import { toHttpParams } from '../utils/http-params.util';

/** /api/v1/agent-investigations: start, read and list investigations by the AI agent. */
@Injectable({ providedIn: 'root' })
export class AgentInvestigationApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = joinUrl(config.apiBaseUrl, 'agent-investigations');
  }

  /**
   * Queues an investigation; the 202 response is the queued one, or the one already queued or running for the run.
   * 400 invalid reference, 404 unknown run, 409 run not failed or feature disabled, 429 AI quota exhausted.
   */
  start(request: StartInvestigationRequest): Observable<AgentInvestigation> {
    return this.http.post<AgentInvestigation>(this.baseUrl, request);
  }

  get(id: number): Observable<AgentInvestigation> {
    return this.http.get<AgentInvestigation>(joinUrl(this.baseUrl, String(id)));
  }

  steps(id: number): Observable<AgentInvestigationStep[]> {
    return this.http.get<AgentInvestigationStep[]>(joinUrl(this.baseUrl, `${id}/steps`));
  }

  /** Newest first. */
  list(filter: AgentInvestigationFilter, size = 20): Observable<PageResponse<AgentInvestigation>> {
    return this.http.get<PageResponse<AgentInvestigation>>(this.baseUrl, {
      params: toHttpParams({
        taskRunName: filter.taskRunName,
        pipelineRunName: filter.pipelineRunName,
        namespace: filter.namespace,
        status: filter.status,
        page: 0,
        size,
        sort: 'createdAt,desc',
      }),
    });
  }
}
