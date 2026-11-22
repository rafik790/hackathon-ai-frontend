import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardApiService } from './dashboard-api.service';

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DashboardApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the summary for a preset range and namespace', () => {
    service.summary({ range: '24h', namespace: 'ci' }).subscribe();
    const req = http.expectOne((r) => r.url === 'api/v1/dashboard/summary');
    expect(req.request.params.get('range')).toBe('24h');
    expect(req.request.params.get('namespace')).toBe('ci');
    expect(req.request.params.has('pipelineName')).toBeFalse();
    req.flush({});
  });

  it('sends granularity in the lower-case form the backend accepts', () => {
    service.trends({ range: '7d', granularity: 'DAY' }).subscribe();
    const req = http.expectOne((r) => r.url === 'api/v1/dashboard/trends');
    expect(req.request.params.get('granularity')).toBe('day');
    req.flush({ from: '', to: '', granularity: 'DAY', points: [] });
  });
});
