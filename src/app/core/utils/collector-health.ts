import { CollectorHealthState, CollectorStatus } from '../models/monitoring.models';

/**
 * Health of the collection loop only. It says nothing about whether pipelines succeed: a healthy
 * collector can be reporting failing pipelines, and a degraded one still serves stored history.
 */
export function collectorHealth(status: CollectorStatus | null): CollectorHealthState {
  if (!status) {
    return 'NO_DATA';
  }
  if (!status.enabled) {
    return 'DISABLED';
  }
  if (!status.lastCycle) {
    return 'NO_DATA';
  }
  return status.lastCycle.successful ? 'HEALTHY' : 'DEGRADED';
}

export const COLLECTOR_HEALTH_LABELS: Readonly<Record<CollectorHealthState, string>> = {
  HEALTHY: 'Collector healthy',
  DEGRADED: 'Collector degraded',
  DISABLED: 'Collector disabled',
  NO_DATA: 'Awaiting first cycle',
  UNREACHABLE: 'Status unavailable',
};
