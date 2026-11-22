import { Observable, catchError, map, of, scan, startWith, switchMap } from 'rxjs';
import { ApiError, isApiError } from './api-error.model';

/**
 * View state of an asynchronously loaded resource. Data from the previous load is kept while a
 * refresh is in flight, so polling never blanks the screen.
 */
export interface LoadState<T> {
  readonly loading: boolean;
  readonly data: T | null;
  readonly error: ApiError | null;
}

type LoadEvent<T> =
  | { readonly kind: 'loading' }
  | { readonly kind: 'data'; readonly data: T }
  | { readonly kind: 'error'; readonly error: ApiError };

export function initialLoadState<T>(): LoadState<T> {
  return { loading: true, data: null, error: null };
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }
  return {
    status: 0,
    title: 'Unexpected error',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    path: null,
    fieldErrors: [],
  };
}

/**
 * Re-runs `fetch` every time `trigger$` emits. `switchMap` cancels a request that is still in flight
 * when a newer trigger arrives, so requests never overlap.
 */
export function loadOnTrigger<P, T>(trigger$: Observable<P>, fetch: (params: P) => Observable<T>): Observable<LoadState<T>> {
  return trigger$.pipe(
    switchMap((params) =>
      fetch(params).pipe(
        map((data): LoadEvent<T> => ({ kind: 'data', data })),
        catchError((error: unknown) => of<LoadEvent<T>>({ kind: 'error', error: toApiError(error) })),
        startWith<LoadEvent<T>>({ kind: 'loading' }),
      ),
    ),
    scan((state: LoadState<T>, event: LoadEvent<T>): LoadState<T> => {
      switch (event.kind) {
        case 'loading':
          return { ...state, loading: true };
        case 'data':
          return { loading: false, data: event.data, error: null };
        case 'error':
          return { ...state, loading: false, error: event.error };
      }
    }, initialLoadState<T>()),
  );
}
