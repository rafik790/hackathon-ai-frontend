import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiError } from '../../../core/models/api-error.model';

/**
 * Card wrapper for charts with consistent header and loading / empty / error states.
 * The chart itself is projected and rendered only when there is data to show.
 */
@Component({
  selector: 'app-chart-card',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card chart-card">
      <header class="card-header">
        <div>
          <h3>{{ title }}</h3>
          <div class="subtitle" *ngIf="subtitle">{{ subtitle }}</div>
        </div>
        <div class="actions"><ng-content select="[chartActions]"></ng-content></div>
      </header>
      <div class="body" [style.min-height.px]="height">
        <app-loading-skeleton *ngIf="loading && !hasData && !error" variant="chart"></app-loading-skeleton>
        <app-error-state *ngIf="error && !hasData" [error]="error" (retry)="retry.emit()"></app-error-state>
        <app-empty-state
          *ngIf="!loading && !error && !hasData"
          icon="bar_chart"
          [title]="emptyTitle"
          [message]="emptyMessage"
          [compact]="true"
        ></app-empty-state>
        <div class="chart" *ngIf="hasData" [style.height.px]="height"><ng-content></ng-content></div>
      </div>
      <footer class="footer" *ngIf="footnote">{{ footnote }}</footer>
    </section>
  `,
  styles: [
    `
      @use 'tokens' as t;
      :host { display: block; min-width: 0; }
      .chart-card { height: 100%; display: flex; flex-direction: column; }
      .body { padding: t.$space-4 t.$space-5; flex: 1; display: flex; flex-direction: column; justify-content: center; }
      .chart { position: relative; width: 100%; }
      .footer { padding: t.$space-2 t.$space-5 t.$space-3; font-size: t.$fs-xs; color: t.$text-muted; border-top: 1px solid t.$gray-100; }
    `,
  ],
})
export class ChartCardComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle: string | null = null;
  @Input() loading = false;
  @Input() error: ApiError | null = null;
  @Input() hasData = false;
  @Input() height = 260;
  @Input() emptyTitle = 'No data for this period';
  @Input() emptyMessage: string | null = 'No executions were recorded in the selected time window.';
  @Input() footnote: string | null = null;
  @Output() readonly retry = new EventEmitter<void>();
}
