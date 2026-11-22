import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort, SortDirection } from '@angular/material/sort';
import { ApiError } from '../../../core/models/api-error.model';
import { RowAction, RowActionEvent, TableColumn } from './data-table.models';

/**
 * Server-driven table: columns are configuration, paging and sorting are emitted to the parent,
 * which reloads from the API. Handles loading, empty and error states consistently.
 */
@Component({
  selector: 'app-data-table',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent<T> {
  @Input({ required: true }) columns: readonly TableColumn<T>[] = [];
  @Input() data: readonly T[] | null = null;
  @Input() totalElements = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 20;
  @Input() pageSizeOptions: readonly number[] = [10, 20, 50, 100];
  @Input() showPaginator = true;
  @Input() sortActive = '';
  @Input() sortDirection: SortDirection = 'desc';
  @Input() loading = false;
  @Input() error: ApiError | null = null;
  @Input() rowActions: readonly RowAction[] = [];
  @Input() emptyTitle = 'No results';
  @Input() emptyMessage: string | null = 'Nothing matches the current filters.';
  @Input() emptyIcon = 'search_off';
  @Input() rowLabel: (row: T) => string = () => 'Open details';
  /** Rows highlighted with a red accent (e.g. failed executions). */
  @Input() highlight: ((row: T) => boolean) | null = null;

  @Output() readonly pageChange = new EventEmitter<PageEvent>();
  @Output() readonly sortChange = new EventEmitter<Sort>();
  @Output() readonly rowClick = new EventEmitter<T>();
  @Output() readonly action = new EventEmitter<RowActionEvent<T>>();
  @Output() readonly retry = new EventEmitter<void>();

  get displayedColumns(): string[] {
    const keys = this.columns.map((column) => column.key);
    return this.rowActions.length ? [...keys, '__actions'] : keys;
  }

  get rows(): T[] {
    return this.data ? [...this.data] : [];
  }

  get hasRows(): boolean {
    return !!this.data && this.data.length > 0;
  }

  cellClass(column: TableColumn<T>): string {
    const classes = [`kind-${column.kind ?? 'text'}`];
    if (column.hideBelow) {
      classes.push(`hide-below-${column.hideBelow}`);
    }
    return classes.join(' ');
  }

  onAction(event: Event, actionId: string, row: T): void {
    event.stopPropagation();
    this.action.emit({ actionId, row });
  }

  trackByIndex(index: number): number {
    return index;
  }
}
