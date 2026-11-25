import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NEVER, Observable, Subject, of, throwError } from 'rxjs';
import { ApiError } from '../../../core/models/api-error.model';
import { FailureAnalysis } from '../../../core/models/failure-analysis.models';
import { FailureAnalysisApiService } from '../../../core/services/failure-analysis-api.service';
import { RefreshService } from '../../../core/services/refresh.service';
import { COMPILATION_ANALYSIS, unfinishedAnalysis } from '../testing/failure-analysis.fixtures';
import { POLL_INTERVAL_MS, SLOW_POLL_INTERVAL_MS, TaskRunAnalysisState, TaskRunAnalysisStore } from './task-run-analysis.store';

describe('TaskRunAnalysisStore', () => {
  let api: jasmine.SpyObj<FailureAnalysisApiService>;
  let ticks: Subject<void>;
  let store: TaskRunAnalysisStore;
  let state: TaskRunAnalysisState;

  beforeEach(() => {
    api = jasmine.createSpyObj<FailureAnalysisApiService>('api', ['latestOfTaskRun', 'request']);
    ticks = new Subject<void>();
    TestBed.configureTestingModule({
      providers: [
        TaskRunAnalysisStore,
        { provide: FailureAnalysisApiService, useValue: api },
        { provide: RefreshService, useValue: { ticks$: ticks } },
      ],
    });
    store = TestBed.inject(TaskRunAnalysisStore);
    store.state$.subscribe((value) => (state = value));
  });

  afterEach(() => store.ngOnDestroy());

  const answers = (...responses: Observable<FailureAnalysis>[]): void => {
    api.latestOfTaskRun.and.returnValues(...responses);
  };

  it('shows a completed analysis without polling or requesting anything', fakeAsync(() => {
    answers(of(COMPILATION_ANALYSIS));
    store.setTaskRun(52);
    store.setTaskRun(52);
    tick(10 * SLOW_POLL_INTERVAL_MS);

    expect(state.analysis).toBe(COMPILATION_ANALYSIS);
    expect(state.loading).toBeFalse();
    expect(api.latestOfTaskRun).toHaveBeenCalledOnceWith(52);
    store.request();
    expect(api.request).not.toHaveBeenCalled();
  }));

  it('treats 404 as a missing analysis and keeps other errors', () => {
    answers(throwError(() => apiError(404)), throwError(() => apiError(503)));
    store.setTaskRun(1);
    expect(state.missing).toBeTrue();
    expect(state.error).toBeNull();

    store.reload();
    expect(state.error?.status).toBe(503);
  });

  it('follows an analysis until it is completed', fakeAsync(() => {
    answers(of(unfinishedAnalysis('PENDING')), of(unfinishedAnalysis('PROCESSING')), of(COMPILATION_ANALYSIS));
    store.setTaskRun(52);
    expect(state.analysis?.status).toBe('PENDING');
    tick(POLL_INTERVAL_MS);
    expect(state.analysis?.status).toBe('PROCESSING');
    tick(POLL_INTERVAL_MS);
    expect(state.analysis?.status).toBe('COMPLETED');

    tick(10 * SLOW_POLL_INTERVAL_MS);
    expect(api.latestOfTaskRun).toHaveBeenCalledTimes(3);
  }));

  it('polls less often while waiting for another attempt', fakeAsync(() => {
    api.latestOfTaskRun.and.returnValue(of(unfinishedAnalysis('RETRY_PENDING')));
    store.setTaskRun(52);
    tick(SLOW_POLL_INTERVAL_MS - 1);
    expect(api.latestOfTaskRun).toHaveBeenCalledTimes(1);
    tick(1);
    expect(api.latestOfTaskRun).toHaveBeenCalledTimes(2);
    store.ngOnDestroy();
  }));

  it('polls less often after an error but keeps what is known', fakeAsync(() => {
    answers(of(unfinishedAnalysis('PROCESSING')), throwError(() => apiError(0)), of(COMPILATION_ANALYSIS));
    store.setTaskRun(52);
    tick(POLL_INTERVAL_MS);
    expect(state.error?.status).toBe(0);
    expect(state.analysis?.status).toBe('PROCESSING');

    tick(SLOW_POLL_INTERVAL_MS - 1);
    expect(api.latestOfTaskRun).toHaveBeenCalledTimes(2);
    tick(1);
    expect(state.analysis?.status).toBe('COMPLETED');
    expect(state.error).toBeNull();
  }));

  it('never sends overlapping requests', () => {
    api.latestOfTaskRun.and.returnValue(NEVER);
    store.setTaskRun(52);
    ticks.next();
    store.reload();

    expect(api.latestOfTaskRun).toHaveBeenCalledTimes(1);
  });

  it('requests a failed analysis again by its evidence id and shows the accepted one', fakeAsync(() => {
    answers(of(unfinishedAnalysis('FAILED')), of(COMPILATION_ANALYSIS));
    const accepted = new Subject<FailureAnalysis>();
    api.request.and.returnValue(accepted);
    store.setTaskRun(52);

    store.request();
    store.request();
    ticks.next();
    expect(api.request).toHaveBeenCalledOnceWith(2);
    expect(api.latestOfTaskRun).toHaveBeenCalledTimes(1);
    expect(state.requesting).toBeTrue();

    accepted.next(unfinishedAnalysis('PENDING', { id: 9, revision: 1 }));
    expect(state.requesting).toBeFalse();
    expect(state.analysis?.status).toBe('PENDING');
    tick(POLL_INTERVAL_MS);
    expect(state.analysis?.status).toBe('COMPLETED');
  }));

  it('shows why an analysis could not be requested', () => {
    api.latestOfTaskRun.and.returnValue(of(unfinishedAnalysis('FAILED')));
    api.request.and.returnValue(throwError(() => apiError(429, 'The daily AI quota is exhausted')));
    store.setTaskRun(52);
    store.request();

    expect(state.requesting).toBeFalse();
    expect(state.requestError?.message).toBe('The daily AI quota is exhausted');
    expect(api.latestOfTaskRun).toHaveBeenCalledTimes(2);
  });

  it('ignores a response that was sent before the analysis was requested', () => {
    const slow = new Subject<FailureAnalysis>();
    answers(of(unfinishedAnalysis('FAILED')), slow);
    api.request.and.returnValue(of(unfinishedAnalysis('PENDING', { id: 9 })));
    store.setTaskRun(52);
    store.reload();
    store.request();
    slow.next(unfinishedAnalysis('FAILED'));

    expect(state.analysis?.id).toBe(9);
  });

  it('starts again for another TaskRun', () => {
    const second = new Subject<FailureAnalysis>();
    answers(of(COMPILATION_ANALYSIS), second);
    store.setTaskRun(52);
    store.setTaskRun(58);

    expect(state.analysis).toBeNull();
    expect(state.loading).toBeTrue();
    expect(api.latestOfTaskRun).toHaveBeenCalledWith(58);
  });

  it('stops when the component is destroyed', fakeAsync(() => {
    api.latestOfTaskRun.and.returnValue(of(unfinishedAnalysis('PROCESSING')));
    store.setTaskRun(52);
    store.ngOnDestroy();
    tick(10 * SLOW_POLL_INTERVAL_MS);

    expect(api.latestOfTaskRun).toHaveBeenCalledTimes(1);
  }));
});

function apiError(status: number, message = 'x'): ApiError {
  return { status, title: 'Error', message, path: null, fieldErrors: [] };
}
