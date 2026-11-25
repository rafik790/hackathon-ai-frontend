import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FailureAnalysisSummary } from '../../../../core/models/failure-analysis.models';
import { LoadState } from '../../../../core/models/load-state';
import { failureCategoryLabel } from '../../../../shared/failure-analysis/failure-analysis-presentation';

/** Newest AI failure analyses, linked to their TaskRuns. */
@Component({
  selector: 'app-recent-analyses',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" aria-label="AI failure analyses">
      <header class="card-header">
        <div>
          <h2>AI failure analyses</h2>
          <div class="subtitle">Newest analyses of all namespaces</div>
        </div>
      </header>
      <app-error-state *ngIf="state.error && state.data" class="notice" [inline]="true" [error]="state.error" (retry)="retry.emit()"></app-error-state>
      <ul *ngIf="state.data?.length; else empty">
        <li *ngFor="let item of state.data; trackBy: trackById">
          <a [routerLink]="['/task-runs', item.taskRunId]" [attr.aria-label]="'Open failure analysis of ' + item.taskRunName">
            <span class="head">
              <app-level-badge *ngIf="item.severity; else status" [level]="item.severity" name="Severity"></app-level-badge>
              <ng-template #status><app-status-badge [status]="item.status" size="sm"></app-status-badge></ng-template>
              <span class="category" *ngIf="item.failureCategory">{{ category(item.failureCategory) }}</span>
              <span class="time">{{ item.analysedAt ?? item.createdAt | relativeTime }}</span>
            </span>
            <span class="summary" *ngIf="item.summary">{{ item.summary }}</span>
            <span class="name mono">{{ item.taskRunName }}</span>
          </a>
        </li>
      </ul>
      <ng-template #empty>
        <div class="card-body" *ngIf="state.loading"><app-loading-skeleton variant="text" [rows]="5"></app-loading-skeleton></div>
        <app-error-state *ngIf="!state.loading && state.error" [error]="state.error" (retry)="retry.emit()"></app-error-state>
        <app-empty-state
          *ngIf="!state.loading && !state.error"
          icon="psychology"
          title="No analyses yet"
          message="Failed TaskRuns appear here after the agent has analysed them."
          [compact]="true"
        ></app-empty-state>
      </ng-template>
    </section>
  `,
  styles: [
    `
      @use 'tokens' as t;
      :host { display: block; min-width: 0; }
      .notice { display: block; padding: t.$space-3 t.$space-4 0; }
      ul { margin: 0; padding: 0; list-style: none; }
      li + li { border-top: 1px solid t.$gray-100; }
      a { display: grid; gap: t.$space-1; padding: t.$space-3 t.$space-5; color: inherit; text-decoration: none; }
      a:hover { background: t.$gray-50; }
      a:focus-visible { outline: 2px solid t.$primary-200; outline-offset: -2px; }
      .head { display: flex; flex-wrap: wrap; align-items: center; gap: t.$space-2; font-size: t.$fs-sm; }
      .category { font-weight: t.$fw-semibold; }
      .time { margin-left: auto; color: t.$text-muted; white-space: nowrap; }
      .summary {
        display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
        font-size: t.$fs-base; overflow-wrap: anywhere;
      }
      .name { font-size: t.$fs-sm; color: t.$text-muted; @include t.truncate; }
    `,
  ],
})
export class RecentAnalysesComponent {
  @Input({ required: true }) state!: LoadState<readonly FailureAnalysisSummary[]>;
  @Output() readonly retry = new EventEmitter<void>();

  readonly category = failureCategoryLabel;

  trackById(_: number, item: FailureAnalysisSummary): number {
    return item.id;
  }
}
