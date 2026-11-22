import { ExecutionStatus } from '../../../core/models/execution.models';

export type ColumnKind = 'text' | 'primary' | 'mono' | 'status' | 'datetime' | 'duration';

export interface DurationValue {
  readonly ms: number | null;
  readonly status: ExecutionStatus | null;
  readonly startTime: string | null;
}

export interface TableColumn<T> {
  /** Column id; also the sort property sent to the backend when sortable. */
  readonly key: string;
  readonly header: string;
  readonly kind?: ColumnKind;
  readonly value?: (row: T) => string | number | null;
  /** Second, muted line under the value. */
  readonly secondary?: (row: T) => string | null;
  readonly duration?: (row: T) => DurationValue;
  readonly sortable?: boolean;
  /** Hide on narrow screens to keep tables readable. */
  readonly hideBelow?: 'md' | 'lg';
  readonly width?: string;
}

export interface RowAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

export interface RowActionEvent<T> {
  readonly actionId: string;
  readonly row: T;
}
