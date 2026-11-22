import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Shimmering placeholder shown before the first response arrives. */
@Component({
  selector: 'app-loading-skeleton',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton" [ngSwitch]="variant" role="status" aria-label="Loading">
      <ng-container *ngSwitchCase="'kpi'">
        <div class="bar" style="width: 45%; height: 30px"></div>
        <div class="bar" style="width: 65%; height: 10px"></div>
      </ng-container>
      <div *ngSwitchCase="'chart'" class="chart">
        <div class="col" *ngFor="let h of chartBars" [style.height.%]="h"></div>
      </div>
      <ng-container *ngSwitchCase="'rows'">
        <div class="row" *ngFor="let r of rowArray">
          <div class="bar" style="width: 28%"></div>
          <div class="bar" style="width: 18%"></div>
          <div class="bar" style="width: 12%"></div>
          <div class="bar" style="width: 20%"></div>
        </div>
      </ng-container>
      <ng-container *ngSwitchDefault>
        <div class="bar" *ngFor="let r of rowArray; let i = index" [style.width.%]="i % 2 ? 60 : 85"></div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      @use 'tokens' as t;
      :host { display: block; }
      .skeleton { display: grid; gap: t.$space-3; }
      .bar, .col {
        height: 12px;
        border-radius: t.$radius-sm;
        background: linear-gradient(90deg, t.$gray-100 25%, t.$gray-50 37%, t.$gray-100 63%);
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;
      }
      .row { display: flex; gap: t.$space-6; padding: t.$space-3 t.$space-5; border-bottom: 1px solid t.$gray-100; }
      .chart { display: flex; align-items: flex-end; gap: 6%; height: 180px; padding: 0 t.$space-2; }
      .col { flex: 1; height: auto; }
      @keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
      @media (prefers-reduced-motion: reduce) { .bar, .col { animation: none; } }
    `,
  ],
})
export class LoadingSkeletonComponent {
  @Input() variant: 'text' | 'rows' | 'kpi' | 'chart' = 'text';
  @Input() rows = 3;

  readonly chartBars: readonly number[] = [40, 65, 50, 80, 55, 70, 45, 60];

  get rowArray(): readonly number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
