import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest, map, shareReplay } from 'rxjs';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { RefreshService } from '../../../../core/services/refresh.service';
import { MonitoringService } from '../../services/monitoring.service';

/** Health of the agent and its Tekton collection loop, kept separate from pipeline outcomes. */
@Component({
  selector: 'app-monitoring',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './monitoring.component.html',
  styleUrls: ['./monitoring.component.scss'],
})
export class MonitoringComponent {
  readonly health$ = loadOnTrigger(this.refresh.trigger$, () => this.monitoring.health()).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly summary$ = loadOnTrigger(this.refresh.trigger$, () => this.monitoring.pipelineSummary24h()).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly collector$ = this.collectorStore.state$;

  readonly dimensions$ = combineLatest([this.health$, this.collector$, this.summary$]).pipe(
    map(([health, collector, summary]) => this.monitoring.dimensions(health, collector, summary)),
  );
  readonly components$ = this.health$.pipe(map((state) => this.monitoring.componentRows(state.data)));
  readonly loading$ = combineLatest([this.health$, this.collector$]).pipe(map(([h, c]) => h.loading || c.loading));

  constructor(
    private readonly monitoring: MonitoringService,
    private readonly collectorStore: CollectorStatusStore,
    private readonly refresh: RefreshService,
  ) {}

  reload(): void {
    this.refresh.refresh();
  }
}
