import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config';
import { ResolutionApiService } from './resolution-api.service';

describe('ResolutionApiService', () => {
  let service: ResolutionApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: APP_CONFIG,
          useValue: { production: false, appVersion: 't', apiBaseUrl: '/agent/api/v1', actuatorBaseUrl: 'a', apiDocsUrl: 'x', autoRefreshIntervalMs: 30000 },
        },
      ],
    });
    service = TestBed.inject(ResolutionApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the resolution and history of TaskRuns and PipelineRuns under the existing resources', () => {
    service.get('TASK_RUN', 52).subscribe();
    service.history('TASK_RUN', 52).subscribe();
    service.get('PIPELINE_RUN', 3).subscribe();
    service.history('PIPELINE_RUN', 3).subscribe();

    for (const url of ['/agent/api/v1/tasks/52/resolution', '/agent/api/v1/tasks/52/resolution/history',
      '/agent/api/v1/pipelines/3/resolution', '/agent/api/v1/pipelines/3/resolution/history']) {
      expect(http.expectOne(url).request.method).toBe('GET');
    }
    http.match(() => true).forEach((req) => req.flush({}));
  });

  it('changes a TaskRun resolution with the version it is based on', () => {
    service.updateTaskRun(52, { status: 'RESOLVED', version: 2, comment: 'why' }).subscribe();

    const req = http.expectOne('/agent/api/v1/tasks/52/resolution');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ status: 'RESOLVED', version: 2, comment: 'why' });
    req.flush({});
  });

  it('reads summaries of several runs', () => {
    service.summaries('TASK_RUN', [1, 2]).subscribe();

    const req = http.expectOne((r) => r.url === '/agent/api/v1/tasks/resolutions');
    expect(req.request.params.get('ids')).toBe('1,2');
    req.flush([]);
  });
});
