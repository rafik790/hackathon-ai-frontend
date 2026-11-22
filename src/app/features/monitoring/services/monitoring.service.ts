import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary } from '../../../core/models/dashboard.models';
import { LoadState } from '../../../core/models/load-state';
import { ApplicationHealth, CollectorStatus, HealthComponent } from '../../../core/models/monitoring.models';
import { AppInfoApiService } from '../../../core/services/app-info-api.service';
import { DashboardApiService } from '../../../core/services/dashboard-api.service';
import { collectorHealth } from '../../../core/utils/collector-health';
import { formatDuration } from '../../../shared/utils/duration';
import { HealthComponentRow, HealthDimension } from '../models/monitoring-view.models';

/**
 * Builds the four independent health dimensions. They are deliberately separate: the agent can be
 * UP while the collector is degraded, and a healthy collector can be reporting failing pipelines.
 */
@Injectable()
export class MonitoringService {
  constructor(private readonly appInfo: AppInfoApiService, private readonly dashboardApi: DashboardApiService) {}

  health(): Observable<ApplicationHealth> {
    return this.appInfo.health();
  }

  pipelineSummary24h(): Observable<DashboardSummary> {
    return this.dashboardApi.summary({ range: '24h' });
  }

  dimensions(
    health: LoadState<ApplicationHealth>,
    collector: LoadState<CollectorStatus>,
    summary: LoadState<DashboardSummary>,
  ): HealthDimension[] {
    return [this.application(health), this.kubernetes(collector), this.collector(collector), this.pipelines(summary)];
  }

  componentRows(health: ApplicationHealth | null): HealthComponentRow[] {
    return Object.entries(health?.components ?? {}).map(([name, component]) => ({
      name,
      status: component.status,
      details: flattenDetails(component),
    }));
  }

  private application(state: LoadState<ApplicationHealth>): HealthDimension {
    const base = { id: 'application' as const, title: 'Application health', icon: 'dns', source: 'GET /actuator/health', link: null };
    if (!state.data) {
      return {
        ...base,
        status: state.error ? 'UNKNOWN' : null,
        statusLabel: state.error ? 'Unreachable' : null,
        headline: state.error ? 'Health endpoint unavailable' : 'Checking…',
        detail: state.error ? state.error.message : 'Querying the Spring Boot health endpoint.',
      };
    }
    const db = state.data.components?.['db'];
    return {
      ...base,
      status: state.data.status,
      statusLabel: null,
      headline: state.data.status === 'UP' ? 'Agent is running' : `Agent reports ${state.data.status}`,
      detail: db ? `Database ${db.status === 'UP' ? 'connected' : db.status.toLowerCase()}` : 'API responding',
    };
  }

  private kubernetes(state: LoadState<CollectorStatus>): HealthDimension {
    const base = {
      id: 'kubernetes' as const,
      title: 'Kubernetes connectivity',
      icon: 'hub',
      source: 'Derived from the last collection cycle',
      link: null,
    };
    const cycle = state.data?.lastCycle ?? null;
    if (!state.data) {
      return { ...base, status: state.error ? 'UNKNOWN' : null, statusLabel: null, headline: state.error ? 'Unknown' : 'Checking…', detail: state.error?.message ?? '' };
    }
    if (!state.data.enabled) {
      return { ...base, status: 'DISABLED', statusLabel: 'Not checked', headline: 'Collector disabled', detail: 'No Kubernetes API calls are made while collection is disabled.' };
    }
    if (!cycle) {
      return { ...base, status: 'NO_DATA', statusLabel: null, headline: 'Not verified yet', detail: 'Waiting for the first collection cycle to finish.' };
    }
    if (cycle.successful) {
      return {
        ...base,
        status: 'UP',
        statusLabel: 'Reachable',
        headline: 'Tekton resources listed',
        detail: `All ${state.data.namespaces.length} namespace(s) listed in the last cycle.`,
      };
    }
    return {
      ...base,
      status: 'DEGRADED',
      statusLabel: 'Errors reported',
      headline: `${cycle.errors.length} error(s) in last cycle`,
      detail: cycle.errors[0] ?? 'The last cycle did not complete successfully.',
    };
  }

  private collector(state: LoadState<CollectorStatus>): HealthDimension {
    const base = { id: 'collector' as const, title: 'Collector health', icon: 'sensors', source: 'GET /api/v1/collector/status', link: null };
    if (!state.data) {
      return { ...base, status: state.error ? 'UNKNOWN' : null, statusLabel: null, headline: state.error ? 'Unknown' : 'Checking…', detail: state.error?.message ?? '' };
    }
    const health = collectorHealth(state.data);
    const s = state.data;
    const detail =
      health === 'DEGRADED'
        ? `${s.consecutiveFailedCycles} consecutive failed cycle(s)`
        : health === 'HEALTHY'
          ? `Polling every ${formatDuration(s.pollingIntervalMs)} · ${s.totalCycles.toLocaleString()} cycles`
          : health === 'DISABLED'
            ? 'Set MONITORING_ENABLED=true on the backend to collect.'
            : 'No cycle has completed since the agent started.';
    return {
      ...base,
      status: health,
      statusLabel: null,
      headline: health === 'HEALTHY' ? 'Collecting normally' : health === 'DEGRADED' ? 'Collection failing' : health === 'DISABLED' ? 'Collection disabled' : 'Awaiting first cycle',
      detail,
    };
  }

  private pipelines(state: LoadState<DashboardSummary>): HealthDimension {
    const base = {
      id: 'pipelines' as const,
      title: 'Pipeline execution health',
      icon: 'account_tree',
      source: 'Last 24 hours · GET /api/v1/dashboard/summary',
      link: '/failure-analysis',
    };
    const s = state.data;
    if (!s) {
      return { ...base, status: state.error ? 'UNKNOWN' : null, statusLabel: null, headline: state.error ? 'Unknown' : 'Checking…', detail: state.error?.message ?? '' };
    }
    const completed = s.successfulExecutions + s.failedExecutions;
    return {
      ...base,
      status: s.failedExecutions > 0 ? 'FAILED' : completed > 0 ? 'SUCCEEDED' : null,
      statusLabel: s.failedExecutions > 0 ? `${s.failedExecutions} failed` : completed > 0 ? 'No failures' : null,
      headline: completed > 0 ? `${s.successRate.toFixed(1)}% success rate` : 'No completed runs',
      detail: `${s.totalExecutions.toLocaleString()} pipeline runs, ${s.runningExecutions} running`,
    };
  }
}

function flattenDetails(component: HealthComponent): { key: string; value: string }[] {
  const details = component.details ?? {};
  return Object.entries(details)
    .filter(([, value]) => value === null || ['string', 'number', 'boolean'].includes(typeof value) || Array.isArray(value))
    .map(([key, value]) => ({ key, value: formatDetail(key, value) }));
}

function formatDetail(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ') || '—';
  }
  if (typeof value === 'number' && /total|free|threshold/i.test(key)) {
    return `${(value / 1024 ** 3).toFixed(1)} GB`;
  }
  if (typeof value === 'number' && /durationms$/i.test(key)) {
    return formatDuration(value);
  }
  return value === null ? '—' : String(value);
}
