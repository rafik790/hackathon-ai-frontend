import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { PageResponse, PipelineRun, PipelineRunSortField, TaskRun } from '../../../core/models/execution.models';
import { PipelineRunApiService } from '../../../core/services/pipeline-run-api.service';
import { ListQueryKeys, ListQueryState, dateBounds } from '../../../shared/execution/list-query';

export const PIPELINE_RUN_QUERY_KEYS: ListQueryKeys = { search: 'pipelineName' };
export const PIPELINE_RUN_SORTABLE: readonly PipelineRunSortField[] = [
  'pipelineRunName',
  'pipelineName',
  'namespace',
  'status',
  'startTime',
  'completionTime',
  'durationMs',
];
export const PIPELINE_RUN_DEFAULT_SORT: PipelineRunSortField = 'startTime';

export interface PipelineRunDetail {
  readonly run: PipelineRun;
  readonly tasks: readonly TaskRun[];
}

@Injectable()
export class PipelineRunsService {
  constructor(private readonly api: PipelineRunApiService) {}

  list(state: ListQueryState<PipelineRunSortField>): Observable<PageResponse<PipelineRun>> {
    const { from, to } = dateBounds(state);
    return this.api.list(
      { pipelineName: state.search || null, status: state.status, namespace: state.namespace, from, to },
      { page: state.page, size: state.size, sort: state.sort, direction: state.direction },
    );
  }

  /** The run and its TaskRuns, requested in parallel. */
  detail(id: number): Observable<PipelineRunDetail> {
    return forkJoin({ run: this.api.get(id), tasks: this.api.tasks(id) });
  }
}
