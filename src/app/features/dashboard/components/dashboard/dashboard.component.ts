import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { TIME_RANGE_PRESETS, TimeRangePreset, parseTimeRangePreset } from '../../../../core/models/dashboard.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { PreferencesService } from '../../../../core/services/preferences.service';
import { RefreshService } from '../../../../core/services/refresh.service';
import { collectorHealth } from '../../../../core/utils/collector-health';
import { BarItem } from '../../../../shared/charts/bar-list-chart.component';
import { STATUS_CHART_COLORS } from '../../../../shared/charts/chart-theme';
import { ChartSegment } from '../../../../shared/charts/doughnut-chart.component';
import { DashboardFilters } from '../../models/dashboard-view.models';
import { DashboardService } from '../../services/dashboard.service';

/** Overview: reliability KPIs, trends and the most recent executions for a time window. */
@Component({
  selector: 'app-dashboard',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  /** Window and namespace live in the URL (?range=24h&namespace=ci). */
  readonly filters$ = this.route.queryParamMap.pipe(
    map((params): DashboardFilters => ({
      range: parseTimeRangePreset(params.get('range')) ?? this.preferences.snapshot.defaultRange,
      namespace: params.get('namespace') || null,
    })),
    distinctUntilChanged((a, b) => a.range === b.range && a.namespace === b.namespace),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly trigger$ = combineLatest([this.filters$, this.refresh.trigger$]).pipe(map(([filters]) => filters));

  readonly summary$ = loadOnTrigger(this.trigger$, (f) => this.dashboard.summary(f)).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  readonly trends$ = loadOnTrigger(this.trigger$, (f) => this.dashboard.trends(f)).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  readonly kpis$ = combineLatest([this.summary$, this.filters$]).pipe(map(([state, filters]) => this.dashboard.kpis(state.data, filters)));

  readonly outcome$ = this.summary$.pipe(
    map((state) => {
      const s = state.data;
      const segments: ChartSegment[] = s
        ? [
            { label: 'Succeeded', value: s.successfulExecutions, color: STATUS_CHART_COLORS.SUCCEEDED },
            { label: 'Failed', value: s.failedExecutions, color: STATUS_CHART_COLORS.FAILED },
          ]
        : [];
      const completed = s ? s.successfulExecutions + s.failedExecutions : 0;
      return { segments, completed, rate: s && completed ? `${s.successRate.toFixed(1)}%` : null };
    }),
  );

  readonly distribution$ = this.summary$.pipe(
    map((state): BarItem[] => {
      const s = state.data;
      return s
        ? [
            { label: 'Succeeded', value: s.successfulExecutions, color: STATUS_CHART_COLORS.SUCCEEDED },
            { label: 'Failed', value: s.failedExecutions, color: STATUS_CHART_COLORS.FAILED },
            { label: 'Running', value: s.runningExecutions, color: STATUS_CHART_COLORS.RUNNING },
            { label: 'Unknown', value: s.unknownExecutions, color: STATUS_CHART_COLORS.UNKNOWN },
          ]
        : [];
    }),
  );

  readonly hasTrendData$ = this.trends$.pipe(map((state) => !!state.data && state.data.points.some((p) => p.total > 0)));

  readonly collector$ = this.collectorStore.state$.pipe(
    map((state) => ({ ...state, health: state.error && !state.data ? ('UNREACHABLE' as const) : collectorHealth(state.data) })),
  );
  readonly namespaces$ = this.collectorStore.namespaces$;
  readonly presets = TIME_RANGE_PRESETS;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dashboard: DashboardService,
    private readonly refresh: RefreshService,
    private readonly preferences: PreferencesService,
    private readonly collectorStore: CollectorStatusStore,
  ) {}

  setRange(range: TimeRangePreset): void {
    this.updateQuery({ range });
  }

  setNamespace(namespace: string | null): void {
    this.updateQuery({ namespace });
  }

  reload(): void {
    this.refresh.refresh();
  }

  rangeLabel(range: TimeRangePreset): string {
    return this.presets.find((p) => p.value === range)?.label ?? range;
  }

  private updateQuery(params: Partial<Record<'range' | 'namespace', string | null>>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
