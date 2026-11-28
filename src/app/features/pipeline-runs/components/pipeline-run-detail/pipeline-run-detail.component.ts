import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, shareReplay, tap } from 'rxjs';
import { TaskRun } from '../../../../core/models/execution.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { RefreshService } from '../../../../core/services/refresh.service';
import { BreadcrumbService } from '../../../../layout/services/breadcrumb.service';
import { PipelineRunDetail, PipelineRunsService } from '../../services/pipeline-runs.service';
import { ResolutionStore } from '../../../../shared/resolution/resolution.store';

export interface TaskSummary {
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly running: number;
  readonly unknown: number;
}

@Component({
  selector: 'app-pipeline-run-detail',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pipeline-run-detail.component.html',
  styleUrls: ['./pipeline-run-detail.component.scss'],
  providers: [ResolutionStore],
})
export class PipelineRunDetailComponent {
  private readonly id$ = this.route.paramMap.pipe(
    map((params) => Number(params.get('id'))),
    distinctUntilChanged(),
  );

  readonly state$ = loadOnTrigger(
    combineLatest([this.id$, this.refresh.trigger$]).pipe(map(([id]) => id)),
    (id) => this.pipelineRuns.detail(id),
  ).pipe(
    tap((state) => state.data && this.breadcrumbs.setCurrentLabel(state.data.run.pipelineRunName)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly taskSummary$ = this.state$.pipe(map((state) => summarize(state.data)));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pipelineRuns: PipelineRunsService,
    private readonly refresh: RefreshService,
    private readonly breadcrumbs: BreadcrumbService,
    resolution: ResolutionStore,
  ) {
    // Manual and automatic refreshes also reload the resolution, so changes made elsewhere show up here.
    this.refresh.ticks$.pipe(takeUntilDestroyed()).subscribe(() => resolution.reload());
  }

  openTask(task: TaskRun): void {
    void this.router.navigate(['/task-runs', task.id]);
  }

  reload(): void {
    this.refresh.refresh();
  }
}

function summarize(detail: PipelineRunDetail | null): TaskSummary | null {
  if (!detail) {
    return null;
  }
  const count = (status: string): number => detail.tasks.filter((t) => t.status === status).length;
  return {
    total: detail.tasks.length,
    succeeded: count('SUCCEEDED'),
    failed: count('FAILED'),
    running: count('RUNNING'),
    unknown: count('UNKNOWN'),
  };
}
