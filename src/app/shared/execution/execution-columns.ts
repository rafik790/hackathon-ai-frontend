import { PipelineRun, TaskRun } from '../../core/models/execution.models';
import { RowAction, TableColumn } from '../components/data-table/data-table.models';

/** Column sets shared by the Overview tables and the list pages. Keys are backend sort properties. */
export function pipelineRunColumns(options: { compact?: boolean } = {}): TableColumn<PipelineRun>[] {
  const columns: TableColumn<PipelineRun>[] = [
    {
      key: 'pipelineRunName',
      header: 'Pipeline run',
      kind: 'primary',
      value: (r) => r.pipelineRunName,
      secondary: options.compact ? (r) => r.pipelineName : undefined,
      sortable: true,
    },
    { key: 'pipelineName', header: 'Pipeline', value: (r) => r.pipelineName, sortable: true, hideBelow: 'md' },
    { key: 'namespace', header: 'Namespace', kind: 'mono', value: (r) => r.namespace, sortable: true, hideBelow: 'md' },
    { key: 'status', header: 'Status', kind: 'status', value: (r) => r.status, sortable: true },
    { key: 'startTime', header: 'Started', kind: 'datetime', value: (r) => r.startTime, sortable: true },
    { key: 'completionTime', header: 'Completed', kind: 'datetime', value: (r) => r.completionTime, sortable: true, hideBelow: 'lg' },
    {
      key: 'durationMs',
      header: 'Duration',
      kind: 'duration',
      duration: (r) => ({ ms: r.durationMs, status: r.status, startTime: r.startTime }),
      sortable: true,
    },
  ];
  return options.compact ? columns.filter((c) => c.key !== 'pipelineName') : columns;
}

export function taskRunColumns(options: { compact?: boolean } = {}): TableColumn<TaskRun>[] {
  const columns: TableColumn<TaskRun>[] = [
    {
      key: 'taskRunName',
      header: 'Task run',
      kind: 'primary',
      value: (r) => r.taskRunName,
      secondary: (r) => (r.pipelineRunName ? `in ${r.pipelineRunName}` : null),
      sortable: true,
    },
    { key: 'taskName', header: 'Task', value: (r) => r.taskName, sortable: true, hideBelow: 'md' },
    { key: 'namespace', header: 'Namespace', kind: 'mono', value: (r) => r.namespace, sortable: true, hideBelow: 'md' },
    { key: 'status', header: 'Status', kind: 'status', value: (r) => r.status, sortable: true },
    { key: 'startTime', header: 'Started', kind: 'datetime', value: (r) => r.startTime, sortable: true },
    { key: 'completionTime', header: 'Completed', kind: 'datetime', value: (r) => r.completionTime, sortable: true, hideBelow: 'lg' },
    {
      key: 'durationMs',
      header: 'Duration',
      kind: 'duration',
      duration: (r) => ({ ms: r.durationMs, status: r.status, startTime: r.startTime }),
      sortable: true,
    },
  ];
  return options.compact ? columns.filter((c) => c.key !== 'completionTime') : columns;
}

export const OPEN_DETAILS_ACTION: RowAction = { id: 'open', label: 'Open details', icon: 'chevron_right' };
export const VIEW_TASKS_ACTION: RowAction = { id: 'tasks', label: 'View task runs', icon: 'checklist' };

export function isFailed(row: { status: string }): boolean {
  return row.status === 'FAILED';
}
