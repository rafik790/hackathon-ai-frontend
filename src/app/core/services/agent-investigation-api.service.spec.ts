import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config';
import { AgentInvestigationApiService } from './agent-investigation-api.service';

describe('AgentInvestigationApiService', () => {
  let service: AgentInvestigationApiService;
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
    service = TestBed.inject(AgentInvestigationApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts an investigation of a TaskRun by name and namespace', () => {
    service.start({ taskRunName: 'build-x', namespace: 'ci' }).subscribe();

    const req = http.expectOne('/agent/api/v1/agent-investigations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ taskRunName: 'build-x', namespace: 'ci' });
    req.flush({}, { status: 202, statusText: 'Accepted' });
  });

  it('reads an investigation and its steps', () => {
    service.get(7).subscribe();
    service.steps(7).subscribe();

    expect(http.expectOne('/agent/api/v1/agent-investigations/7').request.method).toBe('GET');
    expect(http.expectOne('/agent/api/v1/agent-investigations/7/steps').request.method).toBe('GET');
    http.match(() => true).forEach((req) => req.flush({}));
  });

  it('lists the newest investigations of a TaskRun', () => {
    service.list({ taskRunName: 'build-x', namespace: 'ci', pipelineRunName: null }, 1).subscribe();

    const req = http.expectOne((r) => r.url === '/agent/api/v1/agent-investigations');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('taskRunName')).toBe('build-x');
    expect(req.request.params.get('namespace')).toBe('ci');
    expect(req.request.params.get('size')).toBe('1');
    expect(req.request.params.get('sort')).toBe('createdAt,desc');
    expect(req.request.params.has('pipelineRunName')).toBeFalse();
    expect(req.request.params.has('status')).toBeFalse();
    req.flush({});
  });
});
