import { TimeRangePreset } from '../../../core/models/dashboard.models';
import { StatusTone } from '../../../shared/utils/status';

export interface DashboardFilters {
  readonly range: TimeRangePreset;
  readonly namespace: string | null;
}

export interface KpiView {
  readonly id: string;
  readonly label: string;
  readonly value: string | number | null;
  readonly icon: string;
  readonly tone: StatusTone | 'primary';
  readonly caption: string | null;
  readonly link: string;
  readonly queryParams: Record<string, string> | null;
}
