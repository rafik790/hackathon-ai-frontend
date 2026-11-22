import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DashboardSummary } from '../../../core/models/dashboard.models';
import { LoadState } from '../../../core/models/load-state';
import { ApplicationHealth, CollectorStatus } from '../../../core/models/monitoring.models';
import { MonitoringService } from './monitoring.service';

const loaded = <T>(data: T): LoadState<T> => ({ loading: false, data, error: null });

describe('MonitoringService.dimensions', () => {
  let service: MonitoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [MonitoringService] });
    service = TestBed.inject(MonitoringService);
  });

  const collector: CollectorStatus = {
    enabled: true,
    namespaces: ['ci'],
    pollingIntervalMs: 15000,
    totalCycles: 10,
    consecutiveFailedCycles: 2,
    lastSuccessfulCycleAt: null,
    lastCycle: {
      startedAt: '2026-11-21T10:00:00Z',
      finishedAt: '2026-11-21T10:00:01Z',
      durationMs: 900,
      successful: false,
      discovered: {},
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 0,
      errors: ['Kubernetes API error: 403 Forbidden'],
    },
  };

  const summary = {
    successfulExecutions: 9,
    failedExecutions: 1,
    totalExecutions: 10,
    runningExecutions: 0,
    successRate: 90,
  } as DashboardSummary;

  it('keeps application, connectivity, collector and pipeline health independent', () => {
    const health: ApplicationHealth = { status: 'UP', components: { db: { status: 'UP' } } };
    const [app, k8s, coll, pipes] = service.dimensions(loaded(health), loaded(collector), loaded(summary));

    expect(app.status).toBe('UP');
    expect(k8s.status).toBe('DEGRADED');
    expect(k8s.detail).toContain('403');
    expect(coll.status).toBe('DEGRADED');
    expect(pipes.status).toBe('FAILED');
    expect(pipes.headline).toBe('90.0% success rate');
  });
});
