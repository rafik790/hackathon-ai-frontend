import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { ReliabilityAgentStatus } from '../models/reliability-agent.models';
import { FeatureFlagsService } from './feature-flags.service';
import { ReliabilityAgentApiService } from './reliability-agent-api.service';

const CONFIG = { production: false, appVersion: 't', apiBaseUrl: '/agent/api/v1', actuatorBaseUrl: 'a', apiDocsUrl: 'x', autoRefreshIntervalMs: 30000 };

describe('ReliabilityAgentApiService', () => {
  let service: ReliabilityAgentApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [{ provide: APP_CONFIG, useValue: CONFIG }] });
    service = TestBed.inject(ReliabilityAgentApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks a new question and a follow-up', () => {
    service.start('Why?').subscribe();
    service.followUp(4, 'And then?').subscribe();

    const start = http.expectOne('/agent/api/v1/reliability-agent/conversations');
    expect(start.request.method).toBe('POST');
    expect(start.request.body).toEqual({ question: 'Why?' });
    const followUp = http.expectOne('/agent/api/v1/reliability-agent/conversations/4/messages');
    expect(followUp.request.body).toEqual({ question: 'And then?' });
    start.flush({});
    followUp.flush({});
  });

  it('reads the status, the conversations and one conversation', () => {
    service.status().subscribe();
    service.list(5).subscribe();
    service.get(7).subscribe();

    http.expectOne('/agent/api/v1/reliability-agent/status').flush({});
    const list = http.expectOne((r) => r.url === '/agent/api/v1/reliability-agent/conversations');
    expect(list.request.params.get('size')).toBe('5');
    expect(list.request.params.get('sort')).toBe('updatedAt,desc');
    list.flush({ content: [] });
    http.expectOne('/agent/api/v1/reliability-agent/conversations/7').flush({});
  });
});

describe('FeatureFlagsService', () => {
  const flag = (response: () => ReturnType<ReliabilityAgentApiService['status']>): boolean | undefined => {
    TestBed.configureTestingModule({
      providers: [{ provide: ReliabilityAgentApiService, useValue: { status: response } }],
    });
    let value: boolean | undefined;
    TestBed.inject(FeatureFlagsService).reliabilityAgent$.subscribe((v) => (value = v));
    return value;
  };

  it('follows the backend switch', () => {
    expect(flag(() => of({ enabled: true } as ReliabilityAgentStatus))).toBeTrue();
  });

  it('treats a switched-off feature as off', () => {
    expect(flag(() => of({ enabled: false } as ReliabilityAgentStatus))).toBeFalse();
  });

  it('treats an older backend or an error as off', () => {
    expect(flag(() => throwError(() => new Error('404')))).toBeFalse();
  });
});
