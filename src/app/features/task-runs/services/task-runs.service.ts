import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse, TaskRun, TaskRunSortField } from '../../../core/models/execution.models';
import { TaskRunApiService } from '../../../core/services/task-run-api.service';
import { ListQueryKeys, ListQueryState, dateBounds } from '../../../shared/execution/list-query';

export const TASK_RUN_QUERY_KEYS: ListQueryKeys = { search: 'taskName', secondarySearch: 'pipelineRunName' };
export const TASK_RUN_SORTABLE: readonly TaskRunSortField[] = [
  'taskRunName',
  'taskName',
  'pipelineRunName',
  'namespace',
  'status',
  'startTime',
  'completionTime',
  'durationMs',
];
export const TASK_RUN_DEFAULT_SORT: TaskRunSortField = 'startTime';

@Injectable()
export class TaskRunsService {
  constructor(private readonly api: TaskRunApiService) {}

  list(state: ListQueryState<TaskRunSortField>): Observable<PageResponse<TaskRun>> {
    const { from, to } = dateBounds(state);
    return this.api.list(
      {
        taskName: state.search || null,
        pipelineRunName: state.secondarySearch || null,
        status: state.status,
        namespace: state.namespace,
        from,
        to,
      },
      { page: state.page, size: state.size, sort: state.sort, direction: state.direction },
    );
  }

  get(id: number): Observable<TaskRun> {
    return this.api.get(id);
  }
}
