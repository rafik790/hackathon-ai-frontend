import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NEVER, Subject, of } from 'rxjs';
import { TaskRun } from '../../../../core/models/execution.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { RefreshService } from '../../../../core/services/refresh.service';
import { ResolutionApiService } from '../../../../core/services/resolution-api.service';
import { BreadcrumbService } from '../../../../layout/services/breadcrumb.service';
import { ResolutionStore } from '../../../../shared/resolution/resolution.store';
import { SharedModule } from '../../../../shared/shared.module';
import { TaskRunsService } from '../../services/task-runs.service';
import { TaskRunDetailComponent } from './task-run-detail.component';

const FAILED: TaskRun = {
  id: 52, taskRunUid: 'u-52', taskRunName: 'demo-app-build-bb7hj-deploy', namespace: 'ci', pipelineRunUid: 'p-3',
  pipelineRunName: 'demo-app-build-bb7hj', pipelineName: 'demo-app-build', taskName: 'deploy', status: 'FAILED',
  startTime: '2026-11-28T10:00:00Z', completionTime: '2026-11-28T10:01:00Z', durationMs: 60000, failureReason: 'Failed',
  failureMessage: 'forbidden', resourceCreatedAt: null, createdAt: null, updatedAt: null,
};

/** Placement of the sections; the panels themselves are tested on their own. */
describe('TaskRunDetailComponent', () => {
  let resolutionApi: jasmine.SpyObj<ResolutionApiService>;
  let ticks: Subject<void>;
  let fixture: ComponentFixture<TaskRunDetailComponent>;

  const render = (task: TaskRun): HTMLElement => {
    resolutionApi = jasmine.createSpyObj<ResolutionApiService>('api', ['get', 'updateTaskRun', 'history', 'summaries']);
    resolutionApi.get.and.returnValue(NEVER);
    resolutionApi.history.and.returnValue(NEVER);
    ticks = new Subject<void>();
    TestBed.configureTestingModule({
      declarations: [TaskRunDetailComponent],
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      // The panels are custom elements here: only where they are placed matters.
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: String(task.id) })) } },
        { provide: TaskRunsService, useValue: { get: () => of(task) } },
        { provide: RefreshService, useValue: { trigger$: of(undefined), ticks$: ticks, refresh: () => ticks.next() } },
        { provide: BreadcrumbService, useValue: { setCurrentLabel: () => undefined } },
        { provide: ResolutionApiService, useValue: resolutionApi },
        { provide: NotificationService, useValue: { info: () => undefined, error: () => undefined } },
      ],
    });
    fixture = TestBed.createComponent(TaskRunDetailComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => fixture.destroy());

  it('places Resolution as its own section between Failure Analysis and the optional AI investigation', () => {
    const element = render(FAILED);

    const sections = Array.from(element.querySelectorAll('app-failure-analysis-panel, app-resolution-panel, app-agent-investigation-panel'))
      .map((e) => e.tagName.toLowerCase());
    expect(sections).toEqual(['app-failure-analysis-panel', 'app-resolution-panel', 'app-agent-investigation-panel']);
    // Not inside the AI investigation: it is rendered for the TaskRun itself.
    expect(element.querySelector('app-agent-investigation-panel app-resolution-panel')).toBeNull();
    expect(element.querySelector('app-resolution-panel')?.parentElement).toBe(element.querySelector('app-agent-investigation-panel')?.parentElement ?? null);
  });

  it('shows no resolution for a TaskRun that has not failed', () => {
    const element = render({ ...FAILED, status: 'SUCCEEDED', failureReason: null, failureMessage: null });

    expect(element.querySelector('app-resolution-panel')).toBeNull();
  });

  it('reloads the resolution on every refresh, manual or automatic', () => {
    render(FAILED);
    // The page provides the store its sections share.
    const store = fixture.debugElement.injector.get(ResolutionStore);
    spyOn(store, 'reload');

    ticks.next();
    ticks.next();

    expect(store.reload).toHaveBeenCalledTimes(2);
  });
});
