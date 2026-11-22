import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { AppEnvironment } from '../../../../environments/environment.model';
import { APP_CONFIG } from '../../../core/config/app-config';
import { CollectorStatusStore } from '../../../core/services/collector-status.store';
import { COLLECTOR_HEALTH_LABELS } from '../../../core/utils/collector-health';
import { NAV_ITEMS } from '../../navigation';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() collapsed = false;

  readonly items = NAV_ITEMS;
  readonly health$ = this.collector.health$;
  readonly healthLabels = COLLECTOR_HEALTH_LABELS;
  readonly version: string;

  constructor(private readonly collector: CollectorStatusStore, @Inject(APP_CONFIG) config: AppEnvironment) {
    this.version = config.appVersion;
  }
}
