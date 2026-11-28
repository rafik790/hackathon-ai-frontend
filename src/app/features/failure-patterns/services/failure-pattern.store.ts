import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  catchError,
  exhaustMap,
  filter,
  startWith,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
import { ApiError } from '../../../core/models/api-error.model';
import { PatternAnalysis, StartPatternAnalysisRequest, isPatternAnalysisActive } from '../../../core/models/failure-pattern.models';
import { toApiError } from '../../../core/models/load-state';
import { FailurePatternApiService } from '../../../core/services/failure-pattern-api.service';

export interface FailurePatternState {
  readonly loadingHistory: boolean;
  /** Newest first, without reports. */
  readonly history: readonly PatternAnalysis[];
  readonly historyError: ApiError | null;
  /** The analysis shown, with its report once it is read. */
  readonly selected: PatternAnalysis | null;
  readonly selectedError: ApiError | null;
  readonly starting: boolean;
  readonly startError: ApiError | null;
}

const INITIAL_STATE: FailurePatternState = {
  loadingHistory: true,
  history: [],
  historyError: null,
  selected: null,
  selectedError: null,
  starting: false,
  startError: null,
};

export const PATTERN_POLL_MS = 3_000;
export const PATTERN_HISTORY_SIZE = 10;

/**
 * Failure pattern analyses of the Failure Analysis page: shows the newest one and earlier ones, starts a new one only
 * when the user asks, and follows a queued or running one until it is finished. Provided per component; there is
 * never more than one polling loop.
 */
@Injectable()
export class FailurePatternStore implements OnDestroy {
  private readonly state = new BehaviorSubject<FailurePatternState>(INITIAL_STATE);
  private readonly follow$ = new Subject<number>();
  private readonly destroyed$ = new Subject<void>();

  readonly state$: Observable<FailurePatternState> = this.state.asObservable();

  constructor(private readonly api: FailurePatternApiService, @Inject(DOCUMENT) private readonly document: Document) {
    // switchMap: following another analysis ends the loop of the previous one.
    this.follow$
      .pipe(
        switchMap((id) =>
          timer(PATTERN_POLL_MS, PATTERN_POLL_MS).pipe(
            startWith(-1),
            // The first read is immediate, later ones are skipped while the tab is hidden.
            filter((tick) => tick < 0 || this.document.visibilityState !== 'hidden'),
            exhaustMap(() => this.read(id)),
            takeWhile((analysis) => isPatternAnalysisActive(analysis.status)),
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

  /** Reads the history and shows the newest analysis; never starts one. */
  load(): void {
    this.patch({ loadingHistory: true, historyError: null });
    this.api
      .list(PATTERN_HISTORY_SIZE)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (page) => {
          this.patch({ loadingHistory: false, history: page.content });
          const newest = page.content[0];
          if (newest && !this.state.value.selected) {
            this.select(newest.id);
          }
        },
        error: (error: unknown) => this.patch({ loadingHistory: false, historyError: toApiError(error) }),
      });
  }

  /** Shows an analysis of the history; follows it while it runs. */
  select(id: number): void {
    const known = this.state.value.history.find((analysis) => analysis.id === id) ?? null;
    if (this.state.value.selected?.id !== id) {
      this.patch({ selected: known, selectedError: null });
    }
    this.follow$.next(id);
  }

  /** Starts an analysis, or joins the running one for the same period. */
  start(request: StartPatternAnalysisRequest): void {
    const { starting, selected } = this.state.value;
    if (starting || (selected && isPatternAnalysisActive(selected.status))) {
      return;
    }
    this.patch({ starting: true, startError: null });
    this.api
      .start(request)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (accepted) => {
          const history = [accepted, ...this.state.value.history.filter((a) => a.id !== accepted.id)].slice(0, PATTERN_HISTORY_SIZE);
          this.patch({ starting: false, selected: accepted, selectedError: null, history });
          this.follow$.next(accepted.id);
        },
        error: (error: unknown) => this.patch({ starting: false, startError: toApiError(error) }),
      });
  }

  private read(id: number): Observable<PatternAnalysis> {
    return this.api.get(id).pipe(
      tap((analysis) => {
        if (this.state.value.selected && this.state.value.selected.id !== id) {
          return;
        }
        const history = this.state.value.history.map((a) => (a.id === id ? { ...analysis, report: null } : a));
        this.patch({ selected: analysis, selectedError: null, history });
      }),
      catchError((error: unknown) => {
        this.patch({ selectedError: toApiError(error) });
        // Keeps polling; the next tick tries again.
        return EMPTY;
      }),
    );
  }

  private patch(change: Partial<FailurePatternState>): void {
    this.state.next({ ...this.state.value, ...change });
  }
}
