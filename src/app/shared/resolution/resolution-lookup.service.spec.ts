import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ResolutionApiService } from '../../core/services/resolution-api.service';
import { ResolutionLookupService, WithResolution, resolutionColumn } from './resolution-lookup.service';

interface Row {
  readonly id: number;
  readonly name: string;
}

describe('ResolutionLookupService', () => {
  let api: jasmine.SpyObj<ResolutionApiService>;
  let service: ResolutionLookupService;

  beforeEach(() => {
    api = jasmine.createSpyObj<ResolutionApiService>('api', ['get', 'updateTaskRun', 'history', 'summaries']);
    TestBed.configureTestingModule({ providers: [{ provide: ResolutionApiService, useValue: api }] });
    service = TestBed.inject(ResolutionLookupService);
  });

  it('reads the resolutions of a whole page with one request', () => {
    api.summaries.and.returnValue(of([
      { runId: 2, tracked: true, status: 'FIX_IN_PROGRESS', assignedTeam: 'DEVELOPER', updatedAt: null },
      { runId: 1, tracked: false, status: 'OPEN', assignedTeam: null, updatedAt: null },
    ]));
    let rows: WithResolution<Row>[] = [];

    service.attach('TASK_RUN', [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }]).subscribe((value) => (rows = value));

    expect(api.summaries).toHaveBeenCalledOnceWith('TASK_RUN', [1, 2, 3]);
    expect(rows.map((r) => [r.name, r.resolution?.status ?? null])).toEqual([['a', 'OPEN'], ['b', 'FIX_IN_PROGRESS'], ['c', null]]);
  });

  it('asks nothing for an empty page and keeps the rows when the request fails', () => {
    let rows: WithResolution<Row>[] | null = null;
    service.attach('PIPELINE_RUN', []).subscribe((value) => (rows = value));
    expect(rows!).toEqual([]);
    expect(api.summaries).not.toHaveBeenCalled();

    api.summaries.and.returnValue(throwError(() => new Error('offline')));
    service.attach('PIPELINE_RUN', [{ id: 1, name: 'a' }]).subscribe((value) => (rows = value));
    expect(rows!).toEqual([{ id: 1, name: 'a', resolution: null }]);
  });
});

describe('resolutionColumn', () => {
  const column = resolutionColumn<Row>();
  const row = (resolution: WithResolution<Row>['resolution']): WithResolution<Row> => ({ id: 1, name: 'a', resolution });

  it('is a read-only status column', () => {
    expect(column.kind).toBe('status');
    expect(column.header).toBe('Resolution status');
    expect(column.sortable).toBeFalsy();
  });

  it('shows the status, a dash when there is nothing to resolve and Unknown when it could not be read', () => {
    expect(column.value!(row({ runId: 1, tracked: false, status: 'OPEN', assignedTeam: null, updatedAt: null }))).toBe('OPEN');
    expect(column.value!(row({ runId: 1, tracked: true, status: 'REOPENED', assignedTeam: null, updatedAt: null }))).toBe('REOPENED');
    expect(column.value!(row({ runId: 1, tracked: false, status: null, assignedTeam: null, updatedAt: null }))).toBeNull();
    expect(column.value!(row(null))).toBe('UNKNOWN');
  });

  it('adds the TaskRun counts of a PipelineRun', () => {
    const pipeline = row({ runId: 1, tracked: true, status: 'FIX_IN_PROGRESS', assignedTeam: null, updatedAt: null, failedTaskRuns: 3, resolvedTaskRuns: 2 });

    expect(column.secondary!(pipeline)).toBe('2 of 3 resolved');
    expect(column.secondary!(row({ runId: 1, tracked: false, status: 'OPEN', assignedTeam: null, updatedAt: null }))).toBeNull();
  });
});
