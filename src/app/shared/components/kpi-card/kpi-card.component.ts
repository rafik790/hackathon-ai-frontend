import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StatusTone } from '../../utils/status';

/** Metric tile: value, label, icon and an optional caption. Never shows invented trends. */
@Component({
  selector: 'app-kpi-card',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
})
export class KpiCardComponent {
  @Input({ required: true }) label = '';
  @Input() value: string | number | null = null;
  @Input() icon = 'insights';
  @Input() tone: StatusTone | 'primary' = 'primary';
  /** Secondary line, e.g. "87.2% success rate". */
  @Input() caption: string | null = null;
  @Input() loading = false;
  /** Optional router link making the whole card navigable. */
  @Input() link: string | null = null;
  @Input() linkQueryParams: Record<string, string> | null = null;
}
