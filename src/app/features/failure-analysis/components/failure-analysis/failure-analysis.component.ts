import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { TIME_RANGE_PRESETS, TimeRangePreset, parseTimeRangePreset } from '../../../../core/models/dashboard.models';
import { PipelineRun } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { PreferencesService } from '../../../../core/services/preferences.service';
import { RefreshService } from '../../../../core/services/refresh.service';
import { CHART_COLORS } from '../../../../shared/charts/chart-theme';
import { TableColumn } from '../../../../shared/components/data-table/data-table.models';
import { FailureFilters } from '../../models/failure-analysis.models';
import { FailureAnalysisService } from '../../services/failure-analysis.service';

const RECENT_LIMIT = 10;

@Component({
  selector: 'app-failure-analysis',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './failure-analysis.component.html',
  styleUrls: ['./failure-analysis.component.scss'],
})
export class FailureAnalysisComponent {
  readonly filters$ = this.route.queryParamMap.pipe(
    map((params): FailureFilters => ({
      range: parseTimeRangePreset(params.get('range')) ?? this.preferences.snapshot.defaultRange,
      namespace: params.get('namespace') || null,
    })),
    distinctUntilChanged((a, b) => a.range === b.range && a.namespace === b.namespace),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly trigger$ = combineLatest([this.filters$, this.refresh.trigger$]).pipe(map(([filters]) => filters));

  readonly summary$ = loadOnTrigger(this.trigger$, (f) => this.analysis.summary(f)).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  readonly trends$ = loadOnTrigger(this.trigger$, (f) => this.analysis.trends(f)).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  readonly failures$ = loadOnTrigger(this.trigger$, (f) => this.analysis.failures(f)).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  readonly breakdown$ = this.failures$.pipe(map((state) => (state.data ? this.analysis.breakdown(state.data) : null)));
  readonly recent$ = this.failures$.pipe(map((state) => state.data?.pipelineRuns.slice(0, RECENT_LIMIT) ?? null));
  readonly hasFailuresInTrend$ = this.trends$.pipe(map((state) => !!state.data && state.data.points.some((p) => p.total > 0)));
  readonly namespaces$ = this.collector.namespaces$;

  readonly presets = TIME_RANGE_PRESETS;
  readonly dangerColor = CHART_COLORS.danger;
  readonly warningColor = CHART_COLORS.warning;
  readonly neutralColor = '#64748b';

  readonly recentColumns: TableColumn<PipelineRun>[] = [
    { key: 'pipelineRunName', header: 'Pipeline run', kind: 'primary', value: (r) => r.pipelineRunName, secondary: (r) => r.pipelineName },
    { key: 'namespace', header: 'Namespace', kind: 'mono', value: (r) => r.namespace, hideBelow: 'md' },
    { key: 'failureReason', header: 'Failure', value: (r) => r.failureReason ?? 'Failed', secondary: (r) => r.failureMessage },
    { key: 'startTime', header: 'Started', kind: 'datetime', value: (r) => r.startTime },
    {
      key: 'durationMs',
      header: 'Duration',
      kind: 'duration',
      duration: (r) => ({ ms: r.durationMs, status: r.status, startTime: r.startTime }),
      hideBelow: 'md',
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly analysis: FailureAnalysisService,
    private readonly refresh: RefreshService,
    private readonly preferences: PreferencesService,
    private readonly collector: CollectorStatusStore,
  ) {}

  setRange(range: TimeRangePreset): void {
    this.updateQuery({ range });
  }

  setNamespace(namespace: string | null): void {
    this.updateQuery({ namespace });
  }

  openRun(run: PipelineRun): void {
    void this.router.navigate(['/pipeline-runs', run.id]);
  }

  reload(): void {
    this.refresh.refresh();
  }

  rangeLabel(range: TimeRangePreset): string {
    return this.presets.find((p) => p.value === range)?.label ?? range;
  }

  readonly rowLabel = (run: PipelineRun): string => `Open failed PipelineRun ${run.pipelineRunName}`;

  private updateQuery(params: Partial<Record<'range' | 'namespace', string | null>>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
