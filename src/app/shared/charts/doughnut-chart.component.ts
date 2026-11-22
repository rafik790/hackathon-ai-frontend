import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';

export interface ChartSegment {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

/** Doughnut with a centred headline value (e.g. success rate). */
@Component({
  selector: 'app-doughnut-chart',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <canvas baseChart type="doughnut" [data]="data" [options]="options" [attr.aria-label]="ariaLabel" role="img"></canvas>
      <div class="center" *ngIf="centerValue !== null">
        <span class="value">{{ centerValue }}</span>
        <span class="label">{{ centerLabel }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'tokens' as t;
      :host { display: block; position: relative; height: 100%; width: 100%; }
      .wrap { position: relative; height: 100%; }
      .center {
        position: absolute; inset: 0 0 36px 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; pointer-events: none;
      }
      .value { font-size: t.$fs-2xl; font-weight: t.$fw-semibold; letter-spacing: -0.02em; }
      .label { font-size: t.$fs-xs; color: t.$text-muted; text-transform: uppercase; letter-spacing: 0.06em; }
    `,
  ],
})
export class DoughnutChartComponent implements OnChanges {
  @Input({ required: true }) segments: readonly ChartSegment[] = [];
  @Input() centerValue: string | null = null;
  @Input() centerLabel = '';
  @Input() ariaLabel = 'Distribution chart';

  data: ChartData<'doughnut'> = { labels: [], datasets: [] };
  readonly options: ChartOptions<'doughnut'> = {
    cutout: '72%',
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = (ctx.dataset.data as number[]).reduce((sum, v) => sum + v, 0);
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  ngOnChanges(): void {
    this.data = {
      labels: this.segments.map((s) => s.label),
      datasets: [
        {
          data: this.segments.map((s) => s.value),
          backgroundColor: this.segments.map((s) => s.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    };
  }
}
