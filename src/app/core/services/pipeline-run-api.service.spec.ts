import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config';
import { PageResponse, PipelineRun } from '../models/execution.models';
import { PipelineRunApiService } from './pipeline-run-api.service';

describe('PipelineRunApiService', () => {
  let service: PipelineRunApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: APP_CONFIG,
          useValue: { production: false, appVersion: 't', apiBaseUrl: 'api/v1', actuatorBaseUrl: 'actuator', apiDocsUrl: 'x', autoRefreshIntervalMs: 30000 },
        },
      ],
    });
    service = TestBed.inject(PipelineRunApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists pipeline runs with relative URL, filters, paging and Spring sort syntax', () => {
    const page: PageResponse<PipelineRun> = {
      content: [],
      page: 2,
      size: 50,
      totalElements: 0,
      totalPages: 0,
      first: false,
      last: true,
      sort: 'durationMs: ASC',
    };
    let result: PageResponse<PipelineRun> | undefined;

    service
      .list({ namespace: 'ci', status: 'FAILED', pipelineName: '', from: null }, { page: 2, size: 50, sort: 'durationMs', direction: 'asc' })
      .subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === 'api/v1/pipelines');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('namespace')).toBe('ci');
    expect(req.request.params.get('status')).toBe('FAILED');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    expect(req.request.params.get('sort')).toBe('durationMs,asc');
    expect(req.request.params.has('pipelineName')).toBeFalse();
    expect(req.request.params.has('from')).toBeFalse();
    req.flush(page);

    expect(result).toEqual(page);
  });

  it('fetches a run and its task runs by id', () => {
    service.get(42).subscribe();
    service.tasks(42).subscribe();
    expect(http.expectOne('api/v1/pipelines/42').request.method).toBe('GET');
    expect(http.match('api/v1/pipelines/42/tasks').length).toBe(1);
  });
});
