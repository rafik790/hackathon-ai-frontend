import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { DashboardSummary } from '../../../../core/models/dashboard.models';
import { TaskRun } from '../../../../core/models/execution.models';
import { ResolutionSummary } from '../../../../core/models/resolution.models';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { PreferencesService } from '../../../../core/services/preferences.service';
import { RefreshService } from '../../../../core/services/refresh.service';
import { ResolutionApiService } from '../../../../core/services/resolution-api.service';
import { SharedModule } from '../../../../shared/shared.module';
import { FailureAnalysisService, topCounts } from '../../services/failure-analysis.service';
import { FailureAnalysisComponent } from './failure-analysis.component';

function failed(id: number, taskName: string): TaskRun {
  return {
    id, taskRunUid: `u-${id}`, taskRunName: `demo-app-build-bb7hj-${taskName}`, namespace: 'ci', pipelineRunUid: 'p-3',
    pipelineRunName: 'demo-app-build-bb7hj', pipelineName: 'demo-app-build', taskName, status: 'FAILED',
    startTime: '2026-11-28T10:00:00Z', completionTime: null, durationMs: null, failureReason: 'Failed', failureMessage: null,
    resourceCreatedAt: null, createdAt: null, updatedAt: null,
  };
}

const SUMMARY = {
  from: '2026-11-21T10:00:00Z', to: '2026-11-28T10:00:00Z', totalExecutions: 10, successfulExecutions: 7, failedExecutions: 3,
  runningExecutions: 0, unknownExecutions: 0, successRate: 70, failureRate: 30, averageDurationMs: null, p95DurationMs: null,
  totalTaskRuns: 40, failedTaskRuns: 4, taskFailureRate: 10,
  failedTaskRunsByResolution: { OPEN: 1, INVESTIGATING: 1, FIX_IN_PROGRESS: 1, RESOLVED: 1, REOPENED: 0 },
} as DashboardSummary;

describe('FailureAnalysisComponent', () => {
  let resolutionApi: jasmine.SpyObj<ResolutionApiService>;
  let trigger: BehaviorSubject<void>;
  let fixture: ComponentFixture<FailureAnalysisComponent>;
  let summaries: ResolutionSummary[];

  const render = (summary: DashboardSummary = SUMMARY): HTMLElement => {
    const taskRuns = [failed(1, 'build'), failed(2, 'test'), failed(3, 'deploy')];
    summaries = [
      { runId: 1, tracked: true, status: 'RESOLVED', assignedTeam: 'DEVELOPER', updatedAt: null },
      { runId: 2, tracked: true, status: 'FIX_IN_PROGRESS', assignedTeam: 'DEVELOPER', updatedAt: null },
      // A failed TaskRun without a record: the backend reports OPEN.
      { runId: 3, tracked: false, status: 'OPEN', assignedTeam: null, updatedAt: null },
    ];
    resolutionApi = jasmine.createSpyObj<ResolutionApiService>('api', ['get', 'updateTaskRun', 'history', 'summaries']);
    resolutionApi.summaries.and.callFake(() => of(summaries));
    trigger = new BehaviorSubject<void>(undefined);
    TestBed.configureTestingModule({
      declarations: [FailureAnalysisComponent],
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      // The AI analyses panel is not part of what is tested here.
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
        {
          provide: FailureAnalysisService,
          useValue: {
            summary: () => of(summary),
            failures: () => of({ taskRuns, taskRunTotal: taskRuns.length }),
            recentAnalyses: () => of({ items: [], total: 0 }),
            breakdown: (sample: { taskRuns: TaskRun[] }) => ({
              byTask: topCounts(sample.taskRuns.map((t) => t.taskName ?? '')), byReason: [], truncated: false, sampledTaskRuns: 3,
            }),
          },
        },
        { provide: RefreshService, useValue: { trigger$: trigger.asObservable(), refresh: () => trigger.next() } },
        { provide: PreferencesService, useValue: { snapshot: { defaultRange: '7d' } } },
        { provide: CollectorStatusStore, useValue: { namespaces$: of(['ci']) } },
        { provide: ResolutionApiService, useValue: resolutionApi },
      ],
    });
    fixture = TestBed.createComponent(FailureAnalysisComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => fixture.destroy());

  const texts = (element: Element, selector: string): string[] =>
    Array.from(element.querySelectorAll(selector)).map((e) => e.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  const cards = (element: HTMLElement): HTMLElement[] =>
    Array.from(element.querySelectorAll('.resolution-overview app-kpi-card')) as HTMLElement[];

  it('shows the resolution counts of the failed task runs of the window', () => {
    const element = render();

    const shown = cards(element).map((card) => card.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    expect(shown.length).toBe(5);
    expect(shown[0]).toContain('Open');
    expect(shown[0]).toContain('1');
    expect(shown[0]).toContain('25% of failed task runs');
    expect(shown[2]).toContain('Fix in progress');
    expect(shown[3]).toContain('Resolved');
    expect(shown[4]).toContain('Reopened');
    expect(shown[4]).toContain('0');
  });

  it('adds a read-only resolution status column to the recent failed task runs, read with one request', () => {
    const element = render();

    expect(texts(element, 'th')).toContain('Resolution status');
    expect(resolutionApi.summaries).toHaveBeenCalledOnceWith('TASK_RUN', [1, 2, 3]);
    const rows = Array.from(element.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(3);
    expect(texts(rows[0], 'app-status-badge')).toContain('Resolved');
    expect(texts(rows[1], 'app-status-badge')).toContain('Fix in progress');
    expect(texts(rows[2], 'app-status-badge')).toContain('Open');
    // Read-only: no controls in the rows.
    expect(element.querySelectorAll('tbody button, tbody select, tbody mat-select, tbody input').length).toBe(0);
  });

  it('opens the TaskRun page, where the resolution is changed, when a row is clicked', () => {
    const element = render();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    (element.querySelectorAll('tbody tr')[1] as HTMLElement).click();

    expect(navigate).toHaveBeenCalledWith(['/task-runs', 2]);
  });

  it('reads the resolutions again on every refresh', () => {
    const element = render();
    summaries = summaries.map((s) => (s.runId === 2 ? { ...s, status: 'RESOLVED' } : s));

    trigger.next();
    fixture.detectChanges();

    expect(resolutionApi.summaries).toHaveBeenCalledTimes(2);
    expect(texts(element.querySelectorAll('tbody tr')[1], 'app-status-badge')).toContain('Resolved');
  });

  it('hides the resolution cards for a backend without resolution counts', () => {
    const { failedTaskRunsByResolution: _, ...withoutCounts } = SUMMARY;
    const element = render(withoutCounts as DashboardSummary);

    expect(element.querySelector('.resolution-overview')).toBeNull();
    expect(element.querySelector('app-kpi-card')).not.toBeNull();
  });
});
