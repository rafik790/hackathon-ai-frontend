import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { TrendResponse } from '../../core/models/dashboard.models';
import { CHART_HOST_STYLES, CHART_COLORS, formatBucketLabel } from './chart-theme';

/** Failed PipelineRuns per bucket (bars) with the success rate of completed runs (line, right axis). */
@Component({
  selector: 'app-failure-trend-chart',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas baseChart [type]="chartType" [data]="data" [options]="options" aria-label="Failures over time" role="img"></canvas>`,
  styles: [CHART_HOST_STYLES],
})
export class FailureTrendChartComponent implements OnChanges {
  @Input({ required: true }) trend: TrendResponse | null = null;

  /** Mixed chart: bars for failures, a line for the success rate. */
  readonly chartType: 'bar' | 'line' = 'bar';
  data: ChartData<'bar' | 'line', (number | null)[]> = { labels: [], datasets: [] };

  readonly options: ChartOptions<'bar' | 'line'> = {
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { display: false }, border: { color: CHART_COLORS.grid }, ticks: { maxRotation: 0, autoSkipPadding: 16 } },
      y: {
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        ticks: { precision: 0 },
        title: { display: true, text: 'Failed runs', font: { size: 11 } },
      },
      rate: {
        position: 'right',
        min: 0,
        max: 100,
        grid: { display: false },
        border: { display: false },
        ticks: { callback: (value) => `${value}%` },
        title: { display: true, text: 'Success rate', font: { size: 11 } },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.dataset.yAxisID === 'rate'
              ? `${ctx.dataset.label}: ${ctx.parsed.y === null ? 'n/a' : ctx.parsed.y.toFixed(1) + '%'}`
              : `${ctx.dataset.label}: ${ctx.parsed.y}`,
        },
      },
    },
  };

  ngOnChanges(): void {
    const points = this.trend?.points ?? [];
    const granularity = this.trend?.granularity ?? 'DAY';
    this.data = {
      labels: points.map((p) => formatBucketLabel(p.bucketStart, granularity)),
      datasets: [
        {
          type: 'bar',
          label: 'Failed',
          data: points.map((p) => p.failed),
          backgroundColor: CHART_COLORS.danger,
          borderRadius: 3,
          maxBarThickness: 24,
          order: 2,
        },
        {
          type: 'line',
          label: 'Success rate',
          yAxisID: 'rate',
          // Buckets without completed runs have no meaningful rate: leave a gap instead of plotting 0%.
          data: points.map((p) => (p.succeeded + p.failed > 0 ? p.successRate : null)),
          borderColor: CHART_COLORS.success,
          backgroundColor: CHART_COLORS.success,
          pointBackgroundColor: CHART_COLORS.success,
          pointBorderColor: CHART_COLORS.success,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
          tension: 0.3,
          spanGaps: true,
          order: 1,
        },
      ],
    };
  }
}
