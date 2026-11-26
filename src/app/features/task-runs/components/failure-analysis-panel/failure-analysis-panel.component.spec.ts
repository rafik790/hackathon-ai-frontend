import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error.model';
import { FailureAnalysis } from '../../../../core/models/failure-analysis.models';
import { FailureAnalysisApiService } from '../../../../core/services/failure-analysis-api.service';
import { RefreshService } from '../../../../core/services/refresh.service';
import { FailureAnalysisUiModule } from '../../../../shared/failure-analysis/failure-analysis-ui.module';
import { SharedModule } from '../../../../shared/shared.module';
import { COMPILATION_ANALYSIS, RBAC_ANALYSIS, unfinishedAnalysis } from '../../testing/failure-analysis.fixtures';
import { FailureAnalysisResultComponent } from '../failure-analysis-result/failure-analysis-result.component';
import { FailureAnalysisPanelComponent } from './failure-analysis-panel.component';

describe('FailureAnalysisPanelComponent', () => {
  let api: jasmine.SpyObj<FailureAnalysisApiService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let confirmed: boolean;
  let fixture: ComponentFixture<FailureAnalysisPanelComponent>;

  beforeEach(() => {
    api = jasmine.createSpyObj<FailureAnalysisApiService>('api', ['latestOfTaskRun', 'request']);
    confirmed = false;
    dialog = jasmine.createSpyObj<MatDialog>('dialog', ['open']);
    dialog.open.and.callFake((() => ({ afterClosed: () => of(confirmed) })) as unknown as MatDialog['open']);
    TestBed.configureTestingModule({
      declarations: [FailureAnalysisPanelComponent, FailureAnalysisResultComponent],
      imports: [SharedModule, FailureAnalysisUiModule, NoopAnimationsModule],
      providers: [
        { provide: FailureAnalysisApiService, useValue: api },
        { provide: RefreshService, useValue: { ticks$: new Subject<void>() } },
      ],
    });
    TestBed.overrideComponent(FailureAnalysisPanelComponent, { add: { providers: [{ provide: MatDialog, useValue: dialog }] } });
  });

  afterEach(() => fixture.destroy());

  const render = (analysis: FailureAnalysis | null): HTMLElement => {
    api.latestOfTaskRun.and.returnValue(analysis ? of(analysis) : throwError(() => error(404, 'not found')));
    fixture = TestBed.createComponent(FailureAnalysisPanelComponent);
    fixture.componentRef.setInput('taskRunId', 52);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const text = (element: HTMLElement, selector: string): string => element.querySelector(selector)?.textContent?.trim() ?? '';
  const texts = (element: HTMLElement, selector: string): string[] =>
    Array.from(element.querySelectorAll(selector)).map((e) => e.textContent?.trim() ?? '');

  for (const [name, analysis, category] of [
    ['compilation', COMPILATION_ANALYSIS, 'Compilation'],
    ['RBAC', RBAC_ANALYSIS, 'Permission denied'],
  ] as const) {
    it(`shows the result of a ${name} failure as returned by the backend`, () => {
      const element = render(analysis);

      expect(text(element, '.summary')).toBe(analysis.summary ?? '');
      expect(text(element, '.root-cause p')).toBe(analysis.rootCause ?? '');
      expect(text(element, '.category')).toBe(category);
      expect(text(element, '.ratings app-level-badge')).toContain('High');
      expect(text(element, '.confidence')).toContain(`${Math.round((analysis.confidence ?? 0) * 100)}%`);
      expect(text(element, 'app-status-badge')).toBe('Completed');
      expect(texts(element, '.recommendations .action')).toEqual(analysis.recommendedActions?.map((a) => a.action) ?? []);
      expect(texts(element, '.recommendations .reason')).toEqual(analysis.recommendedActions?.map((a) => a.reason) ?? []);
      expect(texts(element, '.evidence pre')).toEqual(analysis.supportingEvidence?.map((e) => e.observation) ?? []);
    });
  }

  it('distinguishes priorities and evidence sources', () => {
    const element = render(COMPILATION_ANALYSIS);

    expect(Array.from(element.querySelectorAll('.recommendations li')).map((li) => li.className)).toEqual(['priority-high', 'priority-medium', 'priority-low']);
    expect(texts(element, '.evidence .origin span')).toEqual(['Container log', 'Container status', 'TaskRun']);
    expect(element.querySelectorAll('.evidence pre.log').length).toBe(1);
  });

  const button = (element: HTMLElement, label: string): HTMLButtonElement | undefined =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.includes(label));

  it('re-analyses a completed analysis only after confirmation', () => {
    const element = render({ ...COMPILATION_ANALYSIS, revision: 2 });
    expect(texts(element, 'button')).toEqual(['autorenew Re-analyse']);
    expect(text(element, '.revision')).toBe('Revision 2');

    button(element, 'Re-analyse')?.click();
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(api.request).not.toHaveBeenCalled();

    confirmed = true;
    api.request.and.returnValue(of(unfinishedAnalysis('PENDING', { id: 9, revision: 3 })));
    button(element, 'Re-analyse')?.click();
    fixture.detectChanges();
    expect(api.request).toHaveBeenCalledOnceWith(2, true);
    expect(text(element, '.progress h3')).toBe('Analysis requested');
    expect(button(element, 'Re-analyse')).toBeUndefined();
  });

  it('explains why re-analysis was rejected and keeps the result', () => {
    const element = render(COMPILATION_ANALYSIS);
    confirmed = true;
    api.request.and.returnValue(throwError(() => error(429, 'The daily AI quota of 100 invocations is exhausted')));
    button(element, 'Re-analyse')?.click();
    fixture.detectChanges();

    expect(text(element, '.inline-alert.notice')).toContain('The daily AI analysis quota is used up.');
    expect(text(element, '.inline-alert.notice')).toContain('The daily AI quota of 100 invocations is exhausted');
    expect(text(element, '.summary')).toBe(COMPILATION_ANALYSIS.summary ?? '');
  });

  it('offers no request while no analysis exists', () => {
    expect(texts(render(null), 'button')).toEqual(['refresh Check again']);
  });

  it('shows an empty state when there is no analysis', () => {
    const element = render(null);

    expect(text(element, 'app-empty-state h3')).toBe('No analysis available');
    api.latestOfTaskRun.and.returnValue(of(COMPILATION_ANALYSIS));
    element.querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();
    expect(text(element, '.summary')).toBe(COMPILATION_ANALYSIS.summary ?? '');
  });

  it('shows the states of an analysis in progress', () => {
    expect(text(render(unfinishedAnalysis('PENDING')), '.progress h3')).toBe('Analysis requested');
    fixture.destroy();
    expect(text(render(unfinishedAnalysis('PROCESSING')), '.progress h3')).toBe('Analysing the failure');
    fixture.destroy();
    const retry = render(unfinishedAnalysis('RETRY_PENDING', { lastError: 'RATE_LIMITED: HTTP 429', nextAttemptAt: null }));
    expect(text(retry, '.progress h3')).toBe('Waiting for another attempt');
    expect(text(retry, '.progress .detail')).toBe('RATE_LIMITED: HTTP 429');
  });

  it('offers another analysis after a failed one', () => {
    const element = render(unfinishedAnalysis('FAILED', { lastError: 'AUTHENTICATION: HTTP 401', processingAttempts: 1 }));
    expect(text(element, '.inline-alert')).toContain('AUTHENTICATION: HTTP 401');

    api.request.and.returnValue(of(unfinishedAnalysis('PENDING', { id: 9 })));
    element.querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();
    expect(api.request).toHaveBeenCalledOnceWith(2, false);
    expect(dialog.open).not.toHaveBeenCalled();
    expect(text(element, '.progress h3')).toBe('Analysis requested');
  });

  it('shows the message of the backend when the request is rejected', () => {
    const element = render(unfinishedAnalysis('FAILED'));
    api.request.and.returnValue(throwError(() => error(409, 'AI analysis is disabled')));
    element.querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();

    expect(text(element, '.inline-alert.notice')).toContain('The analysis cannot be requested right now.');
    expect(text(element, '.inline-alert.notice')).toContain('AI analysis is disabled');
  });

  it('shows texts as text', () => {
    const element = render({ ...COMPILATION_ANALYSIS, summary: '<img src=x onerror=alert(1)>' });

    expect(element.querySelector('img')).toBeNull();
    expect(text(element, '.summary')).toBe('<img src=x onerror=alert(1)>');
  });

  it('does not break on a long line', () => {
    const element = render({ ...COMPILATION_ANALYSIS, rootCause: 'x'.repeat(4000), summary: 'y'.repeat(2000) });
    element.style.width = '400px';
    element.style.display = 'block';

    expect(element.scrollWidth).toBeLessThanOrEqual(400);
  });
});

function error(status: number, message: string): ApiError {
  return { status, title: 'Error', message, path: null, fieldErrors: [] };
}
