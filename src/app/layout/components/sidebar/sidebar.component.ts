import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { AppEnvironment } from '../../../../environments/environment.model';
import { APP_CONFIG } from '../../../core/config/app-config';
import { map, startWith } from 'rxjs';
import { CollectorStatusStore } from '../../../core/services/collector-status.store';
import { FeatureFlagsService } from '../../../core/services/feature-flags.service';
import { COLLECTOR_HEALTH_LABELS } from '../../../core/utils/collector-health';
import { NAV_GROUPS } from '../../navigation';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() collapsed = false;

  /** Items of optional features appear once the backend reports them switched on. */
  readonly groups$ = this.features.reliabilityAgent$.pipe(
    startWith(false),
    map((reliabilityAgent) =>
      NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => !item.feature || reliabilityAgent) })),
    ),
  );
  readonly health$ = this.collector.health$;
  readonly healthLabels = COLLECTOR_HEALTH_LABELS;
  readonly version: string;

  constructor(
    private readonly collector: CollectorStatusStore,
    private readonly features: FeatureFlagsService,
    @Inject(APP_CONFIG) config: AppEnvironment,
  ) {
    this.version = config.appVersion;
  }
}
