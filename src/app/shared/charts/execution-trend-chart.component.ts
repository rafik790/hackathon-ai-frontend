import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { TrendResponse } from '../../core/models/dashboard.models';
import { CHART_HOST_STYLES, STATUS_CHART_COLORS, formatBucketLabel, timeSeriesOptions } from './chart-theme';

/** Stacked bars of PipelineRuns per time bucket, split by status. */
@Component({
  selector: 'app-execution-trend-chart',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas baseChart type="bar" [data]="data" [options]="options" aria-label="Pipeline executions over time" role="img"></canvas>`,
  styles: [CHART_HOST_STYLES],
})
export class ExecutionTrendChartComponent implements OnChanges {
  @Input({ required: true }) trend: TrendResponse | null = null;

  data: ChartData<'bar'> = { labels: [], datasets: [] };
  readonly options: ChartOptions<'bar'> = {
    ...timeSeriesOptions('PipelineRuns', true),
    datasets: { bar: { maxBarThickness: 28, borderRadius: 3, borderSkipped: 'start' } },
  };

  ngOnChanges(): void {
    const points = this.trend?.points ?? [];
    const granularity = this.trend?.granularity ?? 'DAY';
    this.data = {
      labels: points.map((p) => formatBucketLabel(p.bucketStart, granularity)),
      datasets: [
        { label: 'Succeeded', data: points.map((p) => p.succeeded), backgroundColor: STATUS_CHART_COLORS.SUCCEEDED, stack: 's' },
        { label: 'Failed', data: points.map((p) => p.failed), backgroundColor: STATUS_CHART_COLORS.FAILED, stack: 's' },
        { label: 'Running', data: points.map((p) => p.running), backgroundColor: STATUS_CHART_COLORS.RUNNING, stack: 's' },
        { label: 'Unknown', data: points.map((p) => p.unknown), backgroundColor: STATUS_CHART_COLORS.UNKNOWN, stack: 's' },
      ],
    };
  }
}
