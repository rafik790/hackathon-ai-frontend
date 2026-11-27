import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AgentInvestigation } from '../../../core/models/agent-investigation.models';
import { AgentInvestigationApiService } from '../../../core/services/agent-investigation-api.service';
import { COMPLETED, LOG_STEP, REPORT_STEP, TARGET, apiError, investigation, page } from '../testing/agent-investigation.fixtures';
import { AgentInvestigationState, AgentInvestigationStore, INVESTIGATION_POLL_MS } from './agent-investigation.store';

describe('AgentInvestigationStore', () => {
  let api: jasmine.SpyObj<AgentInvestigationApiService>;
  let store: AgentInvestigationStore;
  let state: AgentInvestigationState;
  let started: AgentInvestigation[];

  beforeEach(() => {
    api = jasmine.createSpyObj<AgentInvestigationApiService>('api', ['start', 'get', 'steps', 'list']);
    api.steps.and.returnValue(of([]));
    TestBed.configureTestingModule({ providers: [AgentInvestigationStore, { provide: AgentInvestigationApiService, useValue: api }] });
    store = TestBed.inject(AgentInvestigationStore);
    started = [];
    store.state$.subscribe((value) => (state = value));
    store.started$.subscribe((value) => started.push(value));
  });

  afterEach(() => store.ngOnDestroy());

  const reads = (...responses: Observable<AgentInvestigation>[]): void => {
    api.get.and.returnValues(...responses);
  };

  it('shows that nothing was investigated yet without starting anything', fakeAsync(() => {
    api.list.and.returnValue(of(page()));
    store.setTarget(TARGET);
    store.setTarget({ ...TARGET });
    tick(10 * INVESTIGATION_POLL_MS);

    expect(api.list).toHaveBeenCalledOnceWith({ taskRunName: TARGET.name, namespace: TARGET.namespace }, 1);
    expect(state.loading).toBeFalse();
    expect(state.investigation).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
    expect(api.start).not.toHaveBeenCalled();
  }));

  it('reads a finished investigation once and does not poll it', fakeAsync(() => {
    api.list.and.returnValue(of(page(COMPLETED)));
    reads(of(COMPLETED));
    api.steps.and.returnValue(of([LOG_STEP, REPORT_STEP]));
    store.setTarget(TARGET);
    tick(10 * INVESTIGATION_POLL_MS);

    expect(state.investigation).toBe(COMPLETED);
    expect(state.steps).toEqual([LOG_STEP, REPORT_STEP]);
    expect(api.get).toHaveBeenCalledTimes(1);
  }));

  it('starts an investigation, polls it every few seconds and stops when it is completed', fakeAsync(() => {
    const accepted = new Subject<AgentInvestigation>();
    api.list.and.returnValue(of(page()));
    api.start.and.returnValue(accepted);
    reads(of(investigation('RUNNING')), of(investigation('RUNNING', { stepCount: 1 })), of(COMPLETED));
    store.setTarget(TARGET);

    store.start();
    store.start();
    expect(api.start).toHaveBeenCalledOnceWith({ taskRunName: TARGET.name, namespace: TARGET.namespace });
    expect(state.starting).toBeTrue();

    accepted.next(investigation('PENDING'));
    expect(state.starting).toBeFalse();
    expect(started.map((i) => i.id)).toEqual([7]);
    expect(state.investigation?.status).toBe('RUNNING');
    tick(INVESTIGATION_POLL_MS);
    expect(state.investigation?.stepCount).toBe(1);
    tick(INVESTIGATION_POLL_MS);
    expect(state.investigation).toBe(COMPLETED);
    tick(10 * INVESTIGATION_POLL_MS);
    expect(api.get).toHaveBeenCalledTimes(3);
    expect(api.steps).toHaveBeenCalledTimes(3);
  }));

  it('stops polling when the investigation failed', fakeAsync(() => {
    const failed = investigation('FAILED', { errorMessage: 'The step limit was reached' });
    api.list.and.returnValue(of(page(investigation('RUNNING'))));
    reads(of(investigation('RUNNING')), of(failed));
    store.setTarget(TARGET);
    tick(10 * INVESTIGATION_POLL_MS);

    expect(state.investigation).toBe(failed);
    expect(api.get).toHaveBeenCalledTimes(2);
  }));

  it('never starts a second investigation while one is active, and keeps a single polling loop', fakeAsync(() => {
    api.list.and.returnValue(of(page(investigation('RUNNING'))));
    api.get.and.returnValue(of(investigation('RUNNING')));
    store.setTarget(TARGET);

    store.start();
    store.reload();
    tick(INVESTIGATION_POLL_MS);

    expect(api.start).not.toHaveBeenCalled();
    // Initial read, the restart by reload() and one tick: never two loops in parallel.
    expect(api.get).toHaveBeenCalledTimes(3);
    store.ngOnDestroy();
    tick(10 * INVESTIGATION_POLL_MS);
    expect(api.get).toHaveBeenCalledTimes(3);
  }));

  it('starts again after a finished investigation and replaces its steps', fakeAsync(() => {
    api.list.and.returnValue(of(page(COMPLETED)));
    reads(of(COMPLETED), of(investigation('RUNNING', { id: 8 })));
    api.steps.and.returnValues(of([LOG_STEP, REPORT_STEP]), of([]));
    api.start.and.returnValue(of(investigation('PENDING', { id: 8 })));
    store.setTarget(TARGET);

    store.start();

    expect(api.start).toHaveBeenCalledTimes(1);
    expect(state.investigation?.id).toBe(8);
    expect(state.steps).toEqual([]);
    store.ngOnDestroy();
  }));

  it('shows why a start was refused and stays usable', () => {
    api.list.and.returnValue(of(page()));
    api.start.and.returnValue(throwError(() => apiError(409, 'Agent investigation is disabled')));
    store.setTarget(TARGET);

    store.start();

    expect(state.starting).toBeFalse();
    expect(state.startError?.status).toBe(409);
    expect(state.investigation).toBeNull();
    expect(started).toEqual([]);
  });

  it('keeps the investigation visible and keeps polling after a failed read', fakeAsync(() => {
    api.list.and.returnValue(of(page(investigation('RUNNING'))));
    reads(throwError(() => apiError(0, 'offline')), of(COMPLETED));
    store.setTarget(TARGET);

    expect(state.error?.status).toBe(0);
    expect(state.investigation?.status).toBe('RUNNING');
    tick(INVESTIGATION_POLL_MS);
    expect(state.error).toBeNull();
    expect(state.investigation).toBe(COMPLETED);
  }));

  it('reports a failed lookup of the latest investigation', () => {
    api.list.and.returnValue(throwError(() => apiError(500, 'boom')));
    store.setTarget(TARGET);

    expect(state.loading).toBeFalse();
    expect(state.error?.status).toBe(500);
  });
});
