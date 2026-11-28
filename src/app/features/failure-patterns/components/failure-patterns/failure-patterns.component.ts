import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';

/**
 * Failure Patterns page. The namespace filter lives in the URL (?namespace=), like on the Failure Analysis page, so a
 * reload or a shared link keeps it.
 */
@Component({
  selector: 'app-failure-patterns',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Failure Patterns"
      description="Recurring failures across many runs, their common causes and how to prevent them. Runs only when you start it."
    >
      <ng-container pageActions>
        <mat-form-field appearance="outline" class="compact-field ns-field density-compact">
          <mat-label>Namespace</mat-label>
          <mat-select [value]="(namespace$ | async) ?? ''" (selectionChange)="setNamespace($event.value || null)">
            <mat-option value="">All namespaces</mat-option>
            <mat-option *ngFor="let ns of (namespaces$ | async) ?? []" [value]="ns">{{ ns }}</mat-option>
          </mat-select>
        </mat-form-field>
      </ng-container>
    </app-page-header>

    <div class="page-stack">
      <app-failure-pattern-analysis [namespace]="namespace$ | async"></app-failure-pattern-analysis>
    </div>
  `,
  styles: [`.ns-field { width: 190px; } @media (max-width: 599.98px) { .ns-field { width: 100%; } }`],
})
export class FailurePatternsComponent {
  readonly namespace$ = this.route.queryParamMap.pipe(map((params) => params.get('namespace') || null), distinctUntilChanged());
  readonly namespaces$ = this.collector.namespaces$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly collector: CollectorStatusStore,
  ) {}

  setNamespace(namespace: string | null): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { namespace }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
