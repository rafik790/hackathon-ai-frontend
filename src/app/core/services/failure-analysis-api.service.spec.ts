import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config';
import { FailureAnalysisApiService } from './failure-analysis-api.service';

describe('FailureAnalysisApiService', () => {
  let service: FailureAnalysisApiService;
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
    service = TestBed.inject(FailureAnalysisApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists analyses with filters, paging and Spring sort syntax', () => {
    service.list({ status: 'COMPLETED', severity: null }, { page: 0, size: 4, sort: 'createdAt', direction: 'desc' }).subscribe();

    const req = http.expectOne((r) => r.url === '/agent/api/v1/failure-analyses');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('COMPLETED');
    expect(req.request.params.get('sort')).toBe('createdAt,desc');
    expect(req.request.params.has('severity')).toBeFalse();
    req.flush({});
  });

  it('reads one analysis and the analysis of a TaskRun', () => {
    service.get(3).subscribe();
    service.latestOfTaskRun(52).subscribe();

    expect(http.expectOne('/agent/api/v1/failure-analyses/3').request.method).toBe('GET');
    expect(http.expectOne('/agent/api/v1/tasks/52/analysis').request.method).toBe('GET');
  });

  it('requests an analysis by evidence id without force', () => {
    service.request(2).subscribe();

    const req = http.expectOne('/agent/api/v1/failure-evidence/2/analyse');
    expect(req.request.method).toBe('POST');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({}, { status: 202, statusText: 'Accepted' });
  });
});
