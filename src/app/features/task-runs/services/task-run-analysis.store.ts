import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  merge,
  of,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { ApiError } from '../../../core/models/api-error.model';
import { FailureAnalysis, isAnalysisInProgress } from '../../../core/models/failure-analysis.models';
import { toApiError } from '../../../core/models/load-state';
import { FailureAnalysisApiService } from '../../../core/services/failure-analysis-api.service';
import { RefreshService } from '../../../core/services/refresh.service';

export interface TaskRunAnalysisState {
  readonly loading: boolean;
  readonly analysis: FailureAnalysis | null;
  /** The backend has no analysis for this TaskRun. */
  readonly missing: boolean;
  readonly error: ApiError | null;
  readonly requesting: boolean;
  readonly requestError: ApiError | null;
}

const INITIAL_STATE: TaskRunAnalysisState = {
  loading: true,
  analysis: null,
  missing: false,
  error: null,
  requesting: false,
  requestError: null,
};

export const POLL_INTERVAL_MS = 5_000;
/** Waiting for a later attempt, or after an error. */
export const SLOW_POLL_INTERVAL_MS = 30_000;

/**
 * Analysis of one TaskRun: loads it, follows it while it is being processed and requests a new one. Provided per
 * component. Requests never overlap, and polling stops when the analysis is finished or the tab is hidden.
 */
@Injectable()
export class TaskRunAnalysisStore implements OnDestroy {
  private readonly state = new BehaviorSubject<TaskRunAnalysisState>(INITIAL_STATE);
  private readonly taskRunId$ = new ReplaySubject<number>(1);
  private readonly reload$ = new Subject<void>();
  private readonly destroyed$ = new Subject<void>();
  /** Responses to requests sent before the last change are outdated. */
  private version = 0;

  readonly state$: Observable<TaskRunAnalysisState> = this.state.asObservable();

  constructor(
    private readonly api: FailureAnalysisApiService,
    refresh: RefreshService,
    @Inject(DOCUMENT) document: Document,
  ) {
    const poll$ = this.state.pipe(
      map(pollInterval),
      distinctUntilChanged(),
      switchMap((interval) => (interval === null ? EMPTY : timer(interval, interval))),
      filter(() => document.visibilityState !== 'hidden'),
    );
    this.taskRunId$
      .pipe(
        distinctUntilChanged(),
        tap(() => {
          this.version++;
          this.state.next(INITIAL_STATE);
        }),
        switchMap((id) =>
          merge(of(undefined), refresh.ticks$, this.reload$, poll$).pipe(
            filter(() => !this.state.value.requesting),
            exhaustMap(() => this.load(id)),
          ),
        ),
        takeUntil(this.destroyed$),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  setTaskRun(id: number): void {
    this.taskRunId$.next(id);
  }

  reload(): void {
    this.reload$.next();
  }

  /** Requests another analysis after a failed one. A completed analysis is never replaced. */
  request(): void {
    const { analysis, requesting } = this.state.value;
    if (requesting || analysis?.status !== 'FAILED') {
      return;
    }
    const version = ++this.version;
    this.patch({ requesting: true, requestError: null });
    this.api
      .request(analysis.failureEvidenceId)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (accepted) => {
          if (version === this.version) {
            this.patch({ requesting: false, loading: false, analysis: accepted, missing: false, error: null });
          }
        },
        error: (error: unknown) => {
          if (version === this.version) {
            this.patch({ requesting: false, requestError: toApiError(error) });
            // Somebody else may have requested it in the meantime.
            this.reload();
          }
        },
      });
  }

  private load(id: number): Observable<unknown> {
    const version = this.version;
    this.patch({ loading: true });
    return this.api.latestOfTaskRun(id).pipe(
      tap((analysis) => {
        if (version === this.version) {
          const unchanged = analysis.id === this.state.value.analysis?.id;
          this.patch({
            loading: false,
            analysis,
            missing: false,
            error: null,
            requestError: unchanged ? this.state.value.requestError : null,
          });
        }
      }),
      catchError((error: unknown) => {
        if (version === this.version) {
          const apiError = toApiError(error);
          this.patch(
            apiError.status === 404
              ? { loading: false, analysis: null, missing: true, error: null }
              : { loading: false, error: apiError },
          );
        }
        return EMPTY;
      }),
    );
  }

  private patch(change: Partial<TaskRunAnalysisState>): void {
    this.state.next({ ...this.state.value, ...change });
  }
}

function pollInterval(state: TaskRunAnalysisState): number | null {
  if (!state.analysis || !isAnalysisInProgress(state.analysis.status)) {
    return null;
  }
  return state.error || state.analysis.status === 'RETRY_PENDING' ? SLOW_POLL_INTERVAL_MS : POLL_INTERVAL_MS;
}
