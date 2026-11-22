import { ParamMap, Params } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { EXECUTION_STATUSES, ExecutionStatus, MAX_PAGE_SIZE, SortDirection } from '../../core/models/execution.models';
import { ExecutionFilterValue } from '../components/filter-bar/filter-bar.component';

/**
 * State of an execution list page, kept in the URL query string so that filtered views can be
 * bookmarked, shared and survive a browser refresh.
 */
export interface ListQueryState<S extends string> {
  readonly search: string;
  readonly secondarySearch: string;
  readonly status: ExecutionStatus | null;
  readonly namespace: string | null;
  /** Local calendar dates, yyyy-MM-dd. */
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly page: number;
  readonly size: number;
  readonly sort: S;
  readonly direction: SortDirection;
}

export interface ListQueryKeys {
  /** Query-param name of the primary text filter, e.g. "pipelineName". */
  readonly search: string;
  readonly secondarySearch?: string;
}

export function parseListQuery<S extends string>(
  params: ParamMap,
  keys: ListQueryKeys,
  sortable: readonly S[],
  defaultSort: S,
): ListQueryState<S> {
  const status = params.get('status')?.toUpperCase() as ExecutionStatus | undefined;
  const sort = params.get('sort') as S | null;
  const size = toInt(params.get('size'), 20);
  return {
    search: params.get(keys.search) ?? '',
    secondarySearch: keys.secondarySearch ? params.get(keys.secondarySearch) ?? '' : '',
    status: status && EXECUTION_STATUSES.includes(status) ? status : null,
    namespace: params.get('namespace') || null,
    fromDate: validDate(params.get('from')),
    toDate: validDate(params.get('to')),
    page: Math.max(0, toInt(params.get('page'), 0)),
    size: Math.min(MAX_PAGE_SIZE, Math.max(1, size)),
    sort: sort && sortable.includes(sort) ? sort : defaultSort,
    direction: params.get('dir') === 'asc' ? 'asc' : 'desc',
  };
}

export function listQueryToParams<S extends string>(state: ListQueryState<S>, keys: ListQueryKeys, defaultSort: S): Params {
  return {
    [keys.search]: state.search || null,
    ...(keys.secondarySearch ? { [keys.secondarySearch]: state.secondarySearch || null } : {}),
    status: state.status?.toLowerCase() ?? null,
    namespace: state.namespace,
    from: state.fromDate,
    to: state.toDate,
    page: state.page > 0 ? state.page : null,
    size: state.size !== 20 ? state.size : null,
    sort: state.sort !== defaultSort ? state.sort : null,
    dir: state.direction !== 'desc' ? state.direction : null,
  };
}

export function filterValueOf<S extends string>(state: ListQueryState<S>): ExecutionFilterValue {
  return {
    search: state.search,
    secondarySearch: state.secondarySearch,
    status: state.status,
    namespace: state.namespace,
    from: fromDateString(state.fromDate),
    to: fromDateString(state.toDate),
  };
}

/** Applies a filter change; always returns to the first page. */
export function withFilter<S extends string>(state: ListQueryState<S>, value: ExecutionFilterValue): ListQueryState<S> {
  return {
    ...state,
    search: value.search,
    secondarySearch: value.secondarySearch,
    status: value.status,
    namespace: value.namespace,
    fromDate: toDateString(value.from),
    toDate: toDateString(value.to),
    page: 0,
  };
}

export function withSort<S extends string>(state: ListQueryState<S>, sort: Sort, sortable: readonly S[]): ListQueryState<S> {
  const active = sort.active as S;
  if (!sortable.includes(active) || !sort.direction) {
    return state;
  }
  return { ...state, sort: active, direction: sort.direction, page: 0 };
}

/** Start of the `from` day (inclusive) and start of the day after `to` (exclusive), as ISO instants. */
export function dateBounds(state: { fromDate: string | null; toDate: string | null }): { from: string | null; to: string | null } {
  const from = fromDateString(state.fromDate);
  const to = fromDateString(state.toDate);
  if (to) {
    to.setDate(to.getDate() + 1);
  }
  return { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null };
}

/** ISO instant `range` before now, used to scope "recent" lists to the dashboard window. */
export function rangeStart(range: '24h' | '7d' | '30d', now: number = Date.now()): string {
  const hours = range === '24h' ? 24 : range === '7d' ? 24 * 7 : 24 * 30;
  return new Date(now - hours * 3600 * 1000).toISOString();
}

function toInt(value: string | null, fallback: number): number {
  const parsed = value === null ? NaN : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validDate(value: string | null): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && fromDateString(value) ? value : null;
}

export function toDateString(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateString(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}
