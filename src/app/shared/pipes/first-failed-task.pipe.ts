import { Pipe, PipeTransform } from '@angular/core';
import { TaskRun } from '../../core/models/execution.models';

/** The earliest-started failed TaskRun: where a failed pipeline broke. */
export function firstFailedTask(tasks: readonly TaskRun[] | null | undefined): TaskRun | null {
  const failed = (tasks ?? []).filter((task) => task.status === 'FAILED');
  if (!failed.length) {
    return null;
  }
  const start = (task: TaskRun): number => (task.startTime ? Date.parse(task.startTime) : Number.POSITIVE_INFINITY);
  return [...failed].sort((a, b) => start(a) - start(b))[0];
}

@Pipe({ name: 'firstFailedTask', standalone: false })
export class FirstFailedTaskPipe implements PipeTransform {
  transform(tasks: readonly TaskRun[] | null | undefined): TaskRun | null {
    return firstFailedTask(tasks);
  }
}
