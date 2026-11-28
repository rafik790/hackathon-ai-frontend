import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG, joinUrl } from '../config/app-config';
import {
  Resolution,
  ResolutionHistoryEntry,
  ResolutionSummary,
  ResolutionTargetKind,
  ResolutionUpdateRequest,
} from '../models/resolution.models';

const RESOURCE: Readonly<Record<ResolutionTargetKind, string>> = { TASK_RUN: 'tasks', PIPELINE_RUN: 'pipelines' };

/**
 * /api/v1/tasks/{id}/resolution and /api/v1/pipelines/{id}/resolution: resolution of failed runs and its history.
 * Only TaskRun resolutions can be changed; a PipelineRun resolution is derived from them.
 */
@Injectable({ providedIn: 'root' })
export class ResolutionApiService {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpClient, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.baseUrl = config.apiBaseUrl;
  }

  get(kind: ResolutionTargetKind, id: number): Observable<Resolution> {
    return this.http.get<Resolution>(this.url(kind, id));
  }

  /** 400 invalid value, 404 unknown TaskRun, 409 transition not allowed, stale version or TaskRun not failed. */
  updateTaskRun(taskRunId: number, request: ResolutionUpdateRequest): Observable<Resolution> {
    return this.http.put<Resolution>(this.url('TASK_RUN', taskRunId), request);
  }

  /** Oldest first. */
  history(kind: ResolutionTargetKind, id: number): Observable<ResolutionHistoryEntry[]> {
    return this.http.get<ResolutionHistoryEntry[]>(`${this.url(kind, id)}/history`);
  }

  summaries(kind: ResolutionTargetKind, ids: readonly number[]): Observable<ResolutionSummary[]> {
    return this.http.get<ResolutionSummary[]>(joinUrl(this.baseUrl, `${RESOURCE[kind]}/resolutions`), {
      params: { ids: ids.join(',') },
    });
  }

  private url(kind: ResolutionTargetKind, id: number): string {
    return joinUrl(this.baseUrl, `${RESOURCE[kind]}/${id}/resolution`);
  }
}
