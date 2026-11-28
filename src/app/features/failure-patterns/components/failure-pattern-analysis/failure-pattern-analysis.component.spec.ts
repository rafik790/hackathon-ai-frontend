import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { MatNativeDateModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error.model';
import { FailurePatternReport, PatternAnalysis } from '../../../../core/models/failure-pattern.models';
import { FailurePatternApiService } from '../../../../core/services/failure-pattern-api.service';
import { SharedModule } from '../../../../shared/shared.module';
import { PATTERN_POLL_MS } from '../../services/failure-pattern.store';
import { FailurePatternAnalysisComponent } from './failure-pattern-analysis.component';

const RESOLUTION = { byStatus: { OPEN: 1, INVESTIGATING: 0, FIX_IN_PROGRESS: 0, RESOLVED: 1, REOPENED: 1 }, unresolved: 2, reopenCount: 1, recurrencesAfterResolution: 2 };

const REPORT: FailurePatternReport = {
  statistics: {
    from: '2026-11-21T12:00:00Z', to: '2026-11-28T12:00:00Z', namespace: 'ci', pipelineName: null, totalPipelineRuns: 6,
    failedPipelineRuns: 5, totalTaskRuns: 7, failedTaskRuns: 6, sampledTaskRuns: 6, sampled: false, taskRunsWithAiAnalysis: 4,
    signatureGroupCount: 4, failuresByCategory: { TEST_FAILURE: 3 },
    failuresByResolution: { OPEN: 4, INVESTIGATING: 0, FIX_IN_PROGRESS: 0, RESOLVED: 1, REOPENED: 1 }, reopenedTaskRuns: 1,
  },
  summary: 'Two recurring patterns.',
  patterns: [{
    title: 'OrderServiceTest fails repeatedly', description: 'The unit-test task fails in most builds.', failureCategory: 'TEST_FAILURE',
    occurrences: 3, percentage: 50, firstOccurrence: '2026-11-22T12:00:10Z', lastOccurrence: '2026-11-25T12:00:10Z',
    affectedPipelineRunCount: 3, affectedTaskRunCount: 3,
    affectedPipelineRuns: [{ id: 14, name: 'build-p4', namespace: 'ci' }, { id: null, name: 'build-gone', namespace: 'ci' }],
    affectedTaskRuns: [{ id: 41, name: 'build-p4-unit-test', namespace: 'ci' }],
    taskNames: ['unit-test'], pipelineNames: ['build'], namespaces: ['ci'],
    commonRootCause: 'OrderServiceTest.calculatesTotal expects 42 but gets 41.', evidence: ['3 failures with the same assertion'],
    responsibleTeam: 'DEVELOPER', teamReason: 'Application test code', resolution: RESOLUTION,
    preventiveActions: ['Fix the rounding in OrderService.calculateTotal'], confidence: 'HIGH', confidenceReason: null, signatureGroupIds: ['G1'],
    groupingEvidence: ['G1 · unit-test, 3×: step test: tests failed in <run> [exit 1]. Grouped because: same message'],
  }],
  signatureGroups: [{
    id: 'G1', signature: 'step test: tests failed in <run> [exit 1]', failureCategory: 'TEST_FAILURE', occurrences: 3, pipelineRuns: 3,
    taskNames: ['unit-test'], firstOccurrence: null, lastOccurrence: null, resolution: RESOLUTION,
  }],
  evidenceGaps: ['No logs of the deploy task'],
  limitations: ['Based on the collected runs.'],
  aiAnalysed: true,
};

function analysis(id: number, change: Partial<PatternAnalysis> = {}): PatternAnalysis {
  return {
    id, period: 'LAST_7_DAYS', from: '2026-11-21T12:00:00Z', to: '2026-11-28T12:00:00Z', namespace: 'ci', pipelineName: null,
    status: 'COMPLETED', failedTaskRuns: 6, patternCount: 1, summary: 'Two recurring patterns.', report: REPORT, errorMessage: null,
    provider: 'anthropic', model: 'm', inputTokens: 1, outputTokens: 1, createdAt: '2026-11-28T12:00:00Z', startedAt: null,
    completedAt: null, ...change,
  };
}

describe('FailurePatternAnalysisComponent', () => {
  let api: jasmine.SpyObj<FailurePatternApiService>;
  let fixture: ComponentFixture<FailurePatternAnalysisComponent>;

  const render = (history: PatternAnalysis[], namespace: string | null = 'ci'): HTMLElement => {
    api = jasmine.createSpyObj<FailurePatternApiService>('api', ['start', 'get', 'list']);
    api.list.and.returnValue(of({
      content: history.map((a) => ({ ...a, report: null })), page: 0, size: 10, totalElements: history.length, totalPages: 1,
      first: true, last: true, sort: null,
    }));
    api.get.and.callFake((id: number) => of(history.find((a) => a.id === id) ?? analysis(id)));
    TestBed.configureTestingModule({
      declarations: [FailurePatternAnalysisComponent],
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule, MatNativeDateModule],
      providers: [{ provide: FailurePatternApiService, useValue: api }],
    });
    fixture = TestBed.createComponent(FailurePatternAnalysisComponent);
    fixture.componentInstance.namespace = namespace;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => fixture.destroy());

  const text = (element: Element | null): string => element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const button = (element: HTMLElement): HTMLButtonElement => element.querySelector('button.analyse') as HTMLButtonElement;

  it('shows the newest analysis with its report and never starts one by itself', () => {
    const element = render([analysis(2), analysis(1, { period: 'LAST_30_DAYS' })]);

    expect(api.start).not.toHaveBeenCalled();
    expect(api.get).toHaveBeenCalledOnceWith(2);
    expect(text(element.querySelector('h2'))).toBe('Failure Pattern Analysis');
    const stats = Array.from(element.querySelectorAll('.stats div')).map((d) => `${text(d.querySelector('dt'))}: ${text(d.querySelector('dd'))}`);
    expect(stats).toContain('Failed TaskRuns: 6');
    expect(stats).toContain('PipelineRuns analyzed: 6');
    expect(text(element.querySelector('.history'))).toContain('Last 30 days');
  });

  it('shows each pattern compactly and the full report when it is expanded', () => {
    const element = render([analysis(2)]);
    const pattern = element.querySelector('.pattern')!;
    const header = pattern.querySelector('.head') as HTMLElement;

    // Collapsed: the essentials only.
    expect(text(header)).toContain('OrderServiceTest fails repeatedly');
    expect(text(header)).toContain('Test failure');
    expect(text(header)).toContain('High confidence');
    expect(text(header)).toContain('3 failures · 50%');
    expect(text(header)).toContain('3 PipelineRuns · 3 TaskRuns');
    expect(text(header)).toContain('2 unresolved');
    expect(text(header)).toContain('Recurred 2× after resolved');
    expect(text(header)).toContain('Root cause: OrderServiceTest.calculatesTotal expects 42 but gets 41.');
    expect(text(header)).toContain('Developer');
    expect(text(header)).toContain('View details');
    expect(text(pattern)).not.toContain('Fix the rounding');
    expect(text(pattern)).not.toContain('3 failures with the same assertion');
    expect(pattern.querySelectorAll('a').length).toBe(0);

    header.click();
    fixture.detectChanges();

    expect(text(header)).toContain('Hide details');
    expect(text(pattern)).toContain('Developer — Application test code');
    expect(text(pattern)).toContain('3 failures with the same assertion');
    expect(text(pattern)).toContain('recurred 2× after being marked resolved');
    expect(text(pattern)).toContain('Fix the rounding');
    expect(text(pattern)).toContain('Why these failures are grouped');
    expect(text(pattern.querySelector('.by-status'))).toContain('Reopened 1');
    const links = Array.from(pattern.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/task-runs/41', '/pipeline-runs/14']);
    expect(text(pattern)).toContain('build-gone');
  });

  it('shortens a long summary until the user asks for all of it', () => {
    const summary = 'Recurring failures dominate this period. '.repeat(10).trim();
    const element = render([analysis(2, { report: { ...REPORT, summary } })]);
    const paragraph = element.querySelector('.summary p')!;
    const toggle = element.querySelector('.summary button') as HTMLButtonElement;

    expect(paragraph.classList).toContain('clamp-2');
    expect(text(toggle)).toBe('Show more');
    toggle.click();
    fixture.detectChanges();
    expect(paragraph.classList).not.toContain('clamp-2');
    expect(text(toggle)).toBe('Show less');
  });

  it('starts an analysis of the selected period in the namespace of the page and follows it until it is finished', fakeAsync(() => {
    const element = render([]);
    api.start.and.returnValue(of(analysis(5, { status: 'PENDING', report: null, period: 'LAST_30_DAYS' })));
    const answers = [analysis(5, { status: 'RUNNING', report: null }), analysis(5)];
    api.get.and.callFake(() => of(answers.shift() ?? analysis(5)));
    expect(text(element)).toContain('No pattern analysis yet');

    fixture.componentInstance.period.setValue('LAST_30_DAYS');
    button(element).click();
    fixture.detectChanges();

    expect(api.start).toHaveBeenCalledOnceWith({ period: 'LAST_30_DAYS', namespace: 'ci' });
    expect(element.querySelector('mat-progress-bar')).not.toBeNull();
    expect(button(element).disabled).toBeTrue();

    tick(PATTERN_POLL_MS);
    fixture.detectChanges();
    expect(element.querySelector('.pattern')).not.toBeNull();
    expect(element.querySelector('mat-progress-bar')).toBeNull();
    expect(api.get).toHaveBeenCalledTimes(2);
    tick(PATTERN_POLL_MS * 3);
    expect(api.get).toHaveBeenCalledTimes(2);
    discardPeriodicTasks();
  }));

  it('needs both days of a custom range and sends them as whole days', () => {
    const element = render([], null);
    const component = fixture.componentInstance;
    api.start.and.returnValue(of(analysis(6, { status: 'PENDING', report: null })));

    component.period.setValue('CUSTOM');
    fixture.detectChanges();
    expect(button(element).disabled).toBeTrue();
    component.range.setValue({ start: new Date(2026, 10, 1), end: new Date(2026, 10, 28) });
    fixture.detectChanges();
    button(element).click();

    expect(api.start).toHaveBeenCalledOnceWith({
      period: 'CUSTOM', from: new Date(2026, 10, 1).toISOString(), to: new Date(2026, 10, 29).toISOString(),
    });
  });

  it('shows why an analysis failed and the repeated errors found without AI', () => {
    const partial = { ...REPORT, patterns: [], aiAnalysed: false };
    const element = render([analysis(3, { status: 'FAILED', errorMessage: 'The daily AI quota is exhausted', report: partial })]);

    expect(text(element.querySelector('.inline-alert'))).toContain('The daily AI quota is exhausted');
    const groups = element.querySelector('details.groups') as HTMLDetailsElement;
    expect(groups.open).toBeTrue();
    expect(text(groups)).toContain('step test: tests failed in <run> [exit 1]');
  });

  it('explains a refused start', () => {
    const element = render([]);
    const error: ApiError = { status: 409, title: 'Conflict', message: 'Failure pattern analysis 4 is running', path: null, fieldErrors: [] };
    api.start.and.returnValue(throwError(() => error));

    button(element).click();
    fixture.detectChanges();

    expect(text(element.querySelector('.inline-alert'))).toContain('Cannot start now. Failure pattern analysis 4 is running');
    expect(button(element).disabled).toBeFalse();
  });

  it('opens an earlier analysis from the history', () => {
    const element = render([analysis(2), analysis(1, { summary: 'Older', report: { ...REPORT, summary: 'Older report' } })]);

    (element.querySelectorAll('.history-item')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(api.get).toHaveBeenCalledWith(1);
    expect(text(element.querySelector('.summary'))).toBe('Older report');
    expect(element.querySelectorAll('.history-item')[1].classList).toContain('selected');
  });
});
