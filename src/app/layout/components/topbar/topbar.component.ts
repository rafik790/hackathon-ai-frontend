import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { interval, map, startWith } from 'rxjs';
import { CollectorStatusStore } from '../../../core/services/collector-status.store';
import { LoadingService } from '../../../core/services/loading.service';
import { PreferencesService, REFRESH_INTERVAL_OPTIONS } from '../../../core/services/preferences.service';
import { RefreshService } from '../../../core/services/refresh.service';
import { COLLECTOR_HEALTH_LABELS } from '../../../core/utils/collector-health';
import { formatDuration } from '../../../shared/utils/duration';
import { BreadcrumbService } from '../../services/breadcrumb.service';

@Component({
  selector: 'app-topbar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
  @Input() isHandset = false;
  @Input() collapsed = false;
  @Output() readonly toggleSidebar = new EventEmitter<void>();

  readonly breadcrumbs$ = this.breadcrumbs.breadcrumbs$;
  readonly loading$ = this.loading.loading$;
  readonly lastRefreshed$ = this.loading.lastRefreshedAt$;
  readonly preferences$ = this.preferences.preferences$;
  readonly health$ = this.collector.health$;
  readonly healthLabels = COLLECTOR_HEALTH_LABELS;
  readonly intervals = REFRESH_INTERVAL_OPTIONS.map((ms) => ({ ms, label: formatDuration(ms) }));
  /** Ticks every 15 s so the "last refreshed" text stays current. */
  readonly now$ = interval(15000).pipe(
    startWith(0),
    map(() => Date.now()),
  );

  constructor(
    private readonly breadcrumbs: BreadcrumbService,
    private readonly loading: LoadingService,
    private readonly refreshService: RefreshService,
    private readonly preferences: PreferencesService,
    private readonly collector: CollectorStatusStore,
  ) {}

  refresh(): void {
    this.refreshService.refresh();
  }

  setAutoRefresh(enabled: boolean): void {
    this.preferences.update({ autoRefresh: enabled });
  }

  setInterval(ms: number): void {
    this.preferences.update({ refreshIntervalMs: ms, autoRefresh: true });
  }
}
