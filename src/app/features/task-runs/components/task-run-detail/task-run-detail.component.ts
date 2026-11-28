import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, tap } from 'rxjs';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { RefreshService } from '../../../../core/services/refresh.service';
import { BreadcrumbService } from '../../../../layout/services/breadcrumb.service';
import { ResolutionStore } from '../../../../shared/resolution/resolution.store';
import { TaskRunsService } from '../../services/task-runs.service';

@Component({
  selector: 'app-task-run-detail',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-run-detail.component.html',
  styleUrls: ['./task-run-detail.component.scss'],
  // Shared by the resolution panel and the AI agent panel of the page.
  providers: [ResolutionStore],
})
export class TaskRunDetailComponent {
  private readonly id$ = this.route.paramMap.pipe(
    map((params) => Number(params.get('id'))),
    distinctUntilChanged(),
  );

  readonly state$ = loadOnTrigger(
    combineLatest([this.id$, this.refresh.trigger$]).pipe(map(([id]) => id)),
    (id) => this.taskRuns.get(id),
  ).pipe(tap((state) => state.data && this.breadcrumbs.setCurrentLabel(state.data.taskRunName)));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly taskRuns: TaskRunsService,
    private readonly refresh: RefreshService,
    private readonly breadcrumbs: BreadcrumbService,
    resolution: ResolutionStore,
  ) {
    // Manual and automatic refreshes also reload the resolution, so changes made elsewhere show up here.
    this.refresh.ticks$.pipe(takeUntilDestroyed()).subscribe(() => resolution.reload());
  }

  reload(): void {
    this.refresh.refresh();
  }
}
