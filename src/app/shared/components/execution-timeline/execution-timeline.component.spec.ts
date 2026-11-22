import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskRun } from '../../../core/models/execution.models';
import { ExecutionTimelineComponent } from './execution-timeline.component';

function task(id: number, status: TaskRun['status'], start: string | null, end: string | null): TaskRun {
  return {
    id,
    taskRunUid: `uid-${id}`,
    taskRunName: `run-task-${id}`,
    namespace: 'ci',
    pipelineRunUid: 'p',
    pipelineRunName: 'run',
    pipelineName: 'pipe',
    taskName: `task-${id}`,
    status,
    startTime: start,
    completionTime: end,
    durationMs: start && end ? Date.parse(end) - Date.parse(start) : null,
    failureReason: status === 'FAILED' ? 'Failed' : null,
    failureMessage: null,
    resourceCreatedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

describe('ExecutionTimelineComponent', () => {
  let fixture: ComponentFixture<ExecutionTimelineComponent>;
  let component: ExecutionTimelineComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [ExecutionTimelineComponent], schemas: [NO_ERRORS_SCHEMA] });
    fixture = TestBed.createComponent(ExecutionTimelineComponent);
    component = fixture.componentInstance;
  });

  it('positions bars within the pipeline window and flags the first failure', () => {
    component.tasks = [
      task(1, 'SUCCEEDED', '2026-11-21T10:00:00Z', '2026-11-21T10:01:00Z'),
      task(2, 'FAILED', '2026-11-21T10:01:00Z', '2026-11-21T10:02:00Z'),
      task(3, 'FAILED', '2026-11-21T10:03:00Z', '2026-11-21T10:04:00Z'),
    ];
    component.windowStart = '2026-11-21T10:00:00Z';
    component.windowEnd = '2026-11-21T10:04:00Z';
    component.ngOnChanges();

    expect(component.windowMs).toBe(4 * 60_000);
    expect(component.steps[0].offsetPct).toBe(0);
    expect(component.steps[0].widthPct).toBe(25);
    expect(component.steps[1].offsetPct).toBe(25);
    expect(component.steps.map((s) => s.isFailureOrigin)).toEqual([false, true, false]);
  });

  it('leaves tasks without a start time unpositioned', () => {
    component.tasks = [task(1, 'SUCCEEDED', '2026-11-21T10:00:00Z', '2026-11-21T10:01:00Z'), task(2, 'UNKNOWN', null, null)];
    component.ngOnChanges();
    expect(component.steps[1].offsetPct).toBeNull();
  });
});
