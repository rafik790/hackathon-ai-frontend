import { CollectorStatus } from '../models/monitoring.models';
import { collectorHealth } from './collector-health';

describe('collectorHealth', () => {
  const base: CollectorStatus = {
    enabled: true,
    namespaces: ['ci'],
    pollingIntervalMs: 15000,
    totalCycles: 3,
    consecutiveFailedCycles: 0,
    lastSuccessfulCycleAt: null,
    lastCycle: null,
  };
  const cycle = {
    startedAt: '2026-11-21T10:00:00Z',
    finishedAt: '2026-11-21T10:00:01Z',
    durationMs: 1000,
    discovered: { PipelineRun: 1 },
    created: 0,
    updated: 0,
    unchanged: 1,
    skipped: 0,
    errors: [],
  };

  it('is NO_DATA without status or before the first cycle', () => {
    expect(collectorHealth(null)).toBe('NO_DATA');
    expect(collectorHealth(base)).toBe('NO_DATA');
  });

  it('is DISABLED when collection is turned off', () => {
    expect(collectorHealth({ ...base, enabled: false })).toBe('DISABLED');
  });

  it('follows the outcome of the last cycle', () => {
    expect(collectorHealth({ ...base, lastCycle: { ...cycle, successful: true } })).toBe('HEALTHY');
    expect(collectorHealth({ ...base, lastCycle: { ...cycle, successful: false, errors: ['timeout'] } })).toBe('DEGRADED');
  });
});
