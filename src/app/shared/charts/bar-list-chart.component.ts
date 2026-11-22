import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { CHART_HOST_STYLES, CHART_COLORS } from './chart-theme';

export interface BarItem {
  readonly label: string;
  readonly value: number;
  readonly color?: string;
}

/** Horizontal bars for ranked or categorical counts. */
@Component({
  selector: 'app-bar-list-chart',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas baseChart type="bar" [data]="data" [options]="options" [attr.aria-label]="ariaLabel" role="img"></canvas>`,
  styles: [CHART_HOST_STYLES],
})
export class BarListChartComponent implements OnChanges {
  @Input({ required: true }) items: readonly BarItem[] = [];
  @Input() color: string = CHART_COLORS.primary;
  @Input() valueLabel = 'Count';
  @Input() ariaLabel = 'Bar chart';

  data: ChartData<'bar'> = { labels: [], datasets: [] };
  options: ChartOptions<'bar'> = {};

  ngOnChanges(): void {
    this.data = {
      labels: this.items.map((i) => truncate(i.label, 32)),
      datasets: [
        {
          label: this.valueLabel,
          data: this.items.map((i) => i.value),
          backgroundColor: this.items.map((i) => i.color ?? this.color),
          borderRadius: 4,
          maxBarThickness: 22,
        },
      ],
    };
    this.options = {
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { title: (ctx) => this.items[ctx[0]?.dataIndex ?? 0]?.label ?? '' } },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: CHART_COLORS.grid },
          border: { display: false },
          ticks: { precision: 0 },
          title: { display: true, text: this.valueLabel, font: { size: 11 } },
        },
        y: { grid: { display: false }, border: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text } },
      },
    };
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
