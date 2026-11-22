import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs';
import { EXECUTION_STATUSES, ExecutionStatus } from '../../../core/models/execution.models';
import { statusPresentation } from '../../utils/status';
import { createDateRangeForm } from '../date-range-filter/date-range-filter.component';

export interface ExecutionFilterValue {
  readonly search: string;
  readonly secondarySearch: string;
  readonly status: ExecutionStatus | null;
  readonly namespace: string | null;
  readonly from: Date | null;
  readonly to: Date | null;
}

export const EMPTY_EXECUTION_FILTER: ExecutionFilterValue = {
  search: '',
  secondarySearch: '',
  status: null,
  namespace: null,
  from: null,
  to: null,
};

/**
 * Search, status, namespace and date filters for execution lists. Text fields are debounced;
 * the parent receives one `filterChange` per effective change.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss'],
})
export class FilterBarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() value: ExecutionFilterValue = EMPTY_EXECUTION_FILTER;
  @Input() namespaces: readonly string[] = [];
  @Input() searchLabel = 'Pipeline name';
  @Input() searchHint = 'Exact match';
  /** Second text filter (e.g. PipelineRun name on the TaskRun list); hidden when null. */
  @Input() secondarySearchLabel: string | null = null;
  @Input() showDateRange = true;
  @Output() readonly filterChange = new EventEmitter<ExecutionFilterValue>();

  readonly statuses = EXECUTION_STATUSES.map((status) => ({ value: status, label: statusPresentation(status).label }));

  readonly form = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    secondarySearch: new FormControl('', { nonNullable: true }),
    status: new FormControl<ExecutionStatus | null>(null),
    namespace: new FormControl<string | null>(null),
    dates: createDateRangeForm(),
  });

  private readonly destroy$ = new Subject<void>();
  private lastEmitted: string | null = null;

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        debounceTime(350),
        map(() => this.currentValue()),
        // A half-picked date range (start chosen, end not yet) is not applied.
        filter((value) => !(value.from && !value.to)),
        distinctUntilChanged((a, b) => serialize(a) === serialize(b)),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {
        this.lastEmitted = serialize(value);
        this.filterChange.emit(value);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const incoming = serialize(this.value);
    // Ignore the echo of our own emission: the user may already be typing further.
    if (changes['value'] && incoming !== this.lastEmitted && incoming !== serialize(this.currentValue())) {
      this.form.setValue(
        {
          search: this.value.search,
          secondarySearch: this.value.secondarySearch,
          status: this.value.status,
          namespace: this.value.namespace,
          dates: { start: this.value.from, end: this.value.to },
        },
        { emitEvent: false },
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get activeCount(): number {
    const v = this.currentValue();
    return [v.search, v.secondarySearch, v.status, v.namespace, v.from ?? v.to].filter((x) => !!x).length;
  }

  clear(): void {
    this.form.reset();
  }

  private currentValue(): ExecutionFilterValue {
    const raw = this.form.getRawValue();
    return {
      search: raw.search.trim(),
      secondarySearch: raw.secondarySearch.trim(),
      status: raw.status,
      namespace: raw.namespace,
      from: raw.dates.start,
      to: raw.dates.end,
    };
  }
}

function serialize(value: ExecutionFilterValue): string {
  return JSON.stringify({ ...value, from: value.from?.getTime() ?? null, to: value.to?.getTime() ?? null });
}
