import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config';
import { FailurePatternApiService } from './failure-pattern-api.service';

describe('FailurePatternApiService', () => {
  let service: FailurePatternApiService;
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
    service = TestBed.inject(FailurePatternApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts an analysis with the selected period', () => {
    service.start({ period: 'CUSTOM', from: '2026-11-01T00:00:00.000Z', to: '2026-11-29T00:00:00.000Z' }).subscribe();

    const req = http.expectOne('/agent/api/v1/failure-pattern-analyses');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ period: 'CUSTOM', from: '2026-11-01T00:00:00.000Z', to: '2026-11-29T00:00:00.000Z' });
    req.flush({}, { status: 202, statusText: 'Accepted' });
  });

  it('reads one analysis and lists the newest ones', () => {
    service.get(4).subscribe();
    service.list(5).subscribe();

    const one = http.expectOne('/agent/api/v1/failure-pattern-analyses/4');
    expect(one.request.method).toBe('GET');
    const list = http.expectOne((r) => r.url === '/agent/api/v1/failure-pattern-analyses');
    expect(list.request.params.get('size')).toBe('5');
    expect(list.request.params.get('sort')).toBe('createdAt,desc');
    one.flush({});
    list.flush({ content: [] });
  });
});
