import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ApiError } from '../../core/models/api-error.model';
import { Resolution } from '../../core/models/resolution.models';
import { ResolutionApiService } from '../../core/services/resolution-api.service';
import { FIX_IN_PROGRESS, HISTORY, PIPELINE, resolution } from './testing/resolution.fixtures';
import { ResolutionState, ResolutionStore } from './resolution.store';

describe('ResolutionStore', () => {
  let api: jasmine.SpyObj<ResolutionApiService>;
  let store: ResolutionStore;
  let state: ResolutionState;
  let saved: Resolution[];

  beforeEach(() => {
    api = jasmine.createSpyObj<ResolutionApiService>('api', ['get', 'updateTaskRun', 'history', 'summaries']);
    api.history.and.returnValue(of([]));
    TestBed.configureTestingModule({ providers: [ResolutionStore, { provide: ResolutionApiService, useValue: api }] });
    store = TestBed.inject(ResolutionStore);
    saved = [];
    store.state$.subscribe((value) => (state = value));
    store.saved$.subscribe((value) => saved.push(value));
  });

  afterEach(() => store.ngOnDestroy());

  it('loads the resolution and its history once per target', () => {
    api.get.and.returnValue(of(FIX_IN_PROGRESS));
    api.history.and.returnValue(of(HISTORY));

    store.setTarget({ kind: 'TASK_RUN', id: 52 });
    store.setTarget({ kind: 'TASK_RUN', id: 52 });

    expect(api.get).toHaveBeenCalledOnceWith('TASK_RUN', 52);
    expect(state.loading).toBeFalse();
    expect(state.resolution).toBe(FIX_IN_PROGRESS);
    expect(state.history).toEqual(HISTORY);
  });

  it('sends a change with the version that is shown and refreshes the history', () => {
    const resolved = { ...FIX_IN_PROGRESS, status: 'RESOLVED', version: 2 } as Resolution;
    api.get.and.returnValue(of(FIX_IN_PROGRESS));
    api.updateTaskRun.and.returnValue(of(resolved));
    store.setTarget({ kind: 'TASK_RUN', id: 52 });
    api.history.calls.reset();

    store.update({ status: 'RESOLVED', comment: 'Verified' });

    expect(api.updateTaskRun).toHaveBeenCalledOnceWith(52, { status: 'RESOLVED', comment: 'Verified', version: 1 });
    expect(state.resolution).toBe(resolved);
    expect(state.saving).toBeFalse();
    expect(saved).toEqual([resolved]);
    expect(api.history).toHaveBeenCalledTimes(1);
  });

  it('sends version null for a run that is not tracked yet and never two changes at once', () => {
    const pending = new Subject<Resolution>();
    api.get.and.returnValue(of(resolution()));
    api.updateTaskRun.and.returnValue(pending);
    store.setTarget({ kind: 'TASK_RUN', id: 52 });

    store.update({ status: 'INVESTIGATING' });
    store.update({ status: 'FIX_IN_PROGRESS' });

    expect(api.updateTaskRun).toHaveBeenCalledOnceWith(52, { status: 'INVESTIGATING', version: null });
    expect(state.saving).toBeTrue();
  });

  it('shows a conflict and reloads the current resolution', () => {
    const current = { ...FIX_IN_PROGRESS, version: 3 };
    api.get.and.returnValues(of(FIX_IN_PROGRESS), of(current));
    api.updateTaskRun.and.returnValue(throwError(() => error(409, 'The resolution was changed by someone else')));
    store.setTarget({ kind: 'TASK_RUN', id: 52 });

    store.update({ status: 'RESOLVED' });

    expect(state.saveError?.status).toBe(409);
    expect(state.resolution).toBe(current);
    expect(saved).toEqual([]);
    store.clearSaveError();
    expect(state.saveError).toBeNull();
  });

  it('sends the version the change was based on, so a newer one is reported as a conflict', () => {
    api.get.and.returnValue(of(FIX_IN_PROGRESS));
    api.updateTaskRun.and.returnValue(of(FIX_IN_PROGRESS));
    store.setTarget({ kind: 'TASK_RUN', id: 52 });

    store.update({ status: 'RESOLVED' }, 0);

    expect(api.updateTaskRun).toHaveBeenCalledOnceWith(52, { status: 'RESOLVED', version: 0 });
  });

  it('never changes a PipelineRun resolution, which is derived from its TaskRuns', () => {
    api.get.and.returnValue(of(PIPELINE));
    store.setTarget({ kind: 'PIPELINE_RUN', id: 3 });

    store.update({ status: 'RESOLVED' });

    expect(api.updateTaskRun).not.toHaveBeenCalled();
    expect(state.resolution).toBe(PIPELINE);
  });

  it('shows the latest aggregate after a reload', () => {
    const resolved = { ...PIPELINE, status: 'RESOLVED' } as Resolution;
    api.get.and.returnValues(of(PIPELINE), of(resolved));
    store.setTarget({ kind: 'PIPELINE_RUN', id: 3 });

    store.reload();

    expect(state.resolution?.status).toBe('RESOLVED');
  });

  it('reports a failed read and can retry', () => {
    api.get.and.returnValues(throwError(() => error(500, 'boom')), of(FIX_IN_PROGRESS));
    store.setTarget({ kind: 'PIPELINE_RUN', id: 3 });

    expect(state.loading).toBeFalse();
    expect(state.error?.status).toBe(500);
    store.reload();
    expect(state.error).toBeNull();
    expect(state.resolution).toBe(FIX_IN_PROGRESS);
  });
});

function error(status: number, message: string): ApiError {
  return { status, title: 'Error', message, path: null, fieldErrors: [] };
}
