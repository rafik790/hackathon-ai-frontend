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
  forkJoin,
  map,
  startWith,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
import { ApiError } from '../../../core/models/api-error.model';
import {
  AgentInvestigation,
  AgentInvestigationStep,
  StartInvestigationRequest,
  isInvestigationActive,
} from '../../../core/models/agent-investigation.models';
import { toApiError } from '../../../core/models/load-state';
import { AgentInvestigationApiService } from '../../../core/services/agent-investigation-api.service';

/** The failed run the investigation is about. */
export interface InvestigationTarget {
  readonly kind: 'TASK_RUN' | 'PIPELINE_RUN';
  readonly name: string;
  readonly namespace: string;
}

export interface AgentInvestigationState {
  /** Looking for an earlier investigation of the target. */
  readonly loading: boolean;
  readonly investigation: AgentInvestigation | null;
  readonly steps: readonly AgentInvestigationStep[];
  /** Reading the investigation failed; what is known stays visible. */
  readonly error: ApiError | null;
  readonly starting: boolean;
  readonly startError: ApiError | null;
}

const INITIAL_STATE: AgentInvestigationState = {
  loading: true,
  investigation: null,
  steps: [],
  error: null,
  starting: false,
  startError: null,
};

export const INVESTIGATION_POLL_MS = 3_000;

/**
 * Investigation of one failed run by the AI agent: shows the latest one, starts a new one on request and follows it
 * until it is completed or failed. Provided per component; there is never more than one polling loop.
 */
@Injectable()
export class AgentInvestigationStore implements OnDestroy {
  private readonly state = new BehaviorSubject<AgentInvestigationState>(INITIAL_STATE);
  private readonly follow$ = new Subject<number>();
  private readonly destroyed$ = new Subject<void>();
  private readonly startedSubject = new Subject<AgentInvestigation>();
  private target: InvestigationTarget | null = null;
  /** Responses that belong to an earlier target are ignored. */
  private version = 0;

  readonly state$: Observable<AgentInvestigationState> = this.state.asObservable();
  /** Each investigation the backend accepted after start(). */
  readonly started$: Observable<AgentInvestigation> = this.startedSubject.asObservable();

  constructor(private readonly api: AgentInvestigationApiService, @Inject(DOCUMENT) private readonly document: Document) {
    // switchMap: following a new investigation ends the loop of the previous one.
    this.follow$
      .pipe(
        switchMap((id) =>
          // The first read is immediate, later ones are skipped while the tab is hidden.
          timer(INVESTIGATION_POLL_MS, INVESTIGATION_POLL_MS).pipe(
            startWith(-1),
            filter((tick) => tick < 0 || this.document.visibilityState !== 'hidden'),
            // exhaustMap: a slow response is never overtaken by the next request.
            exhaustMap(() => this.refresh(id)),
            takeWhile((investigation) => isInvestigationActive(investigation.status)),
          ),
        ),
        takeUntil(this.destroyed$),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.startedSubject.complete();
  }

  /** Shows the newest investigation of the target, if there is one; never starts one. */
  setTarget(target: InvestigationTarget): void {
    if (this.target && this.target.kind === target.kind && this.target.name === target.name && this.target.namespace === target.namespace) {
      return;
    }
    this.target = target;
    const version = ++this.version;
    this.state.next(INITIAL_STATE);
    this.api
      .list(target.kind === 'TASK_RUN' ? { taskRunName: target.name, namespace: target.namespace }
        : { pipelineRunName: target.name, namespace: target.namespace }, 1)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (page) => {
          if (version !== this.version) {
            return;
          }
          const latest = page.content[0] ?? null;
          this.patch({ loading: false, investigation: latest });
          if (latest) {
            this.follow$.next(latest.id);
          }
        },
        error: (error: unknown) => {
          if (version === this.version) {
            this.patch({ loading: false, error: toApiError(error) });
          }
        },
      });
  }

  /** Starts an investigation of the target, or joins the one that is already running for it. */
  start(): void {
    const target = this.target;
    const { starting, investigation } = this.state.value;
    if (!target || starting || (investigation && isInvestigationActive(investigation.status))) {
      return;
    }
    const version = this.version;
    const request: StartInvestigationRequest = target.kind === 'TASK_RUN'
      ? { taskRunName: target.name, namespace: target.namespace }
      : { pipelineRunName: target.name, namespace: target.namespace };
    this.patch({ starting: true, startError: null });
    this.api
      .start(request)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (accepted) => {
          if (version === this.version) {
            // The steps belong to the previous investigation unless the backend returned the same one.
            const steps = accepted.id === investigation?.id ? this.state.value.steps : [];
            this.patch({ starting: false, investigation: accepted, steps, error: null });
            this.follow$.next(accepted.id);
            this.startedSubject.next(accepted);
          }
        },
        error: (error: unknown) => {
          if (version === this.version) {
            this.patch({ starting: false, startError: toApiError(error) });
          }
        },
      });
  }

  /** Reads the investigation and its steps once more, e.g. after an error. */
  reload(): void {
    const investigation = this.state.value.investigation;
    if (investigation) {
      this.follow$.next(investigation.id);
    }
  }

  private refresh(id: number): Observable<AgentInvestigation> {
    const version = this.version;
    return forkJoin({ investigation: this.api.get(id), steps: this.api.steps(id) }).pipe(
      tap(({ investigation, steps }) => {
        if (version === this.version) {
          this.patch({ investigation, steps, error: null });
        }
      }),
      map(({ investigation }) => investigation),
      catchError((error: unknown) => {
        if (version === this.version) {
          this.patch({ error: toApiError(error) });
        }
        // Keeps polling; the next tick tries again.
        return EMPTY;
      }),
    );
  }

  private patch(change: Partial<AgentInvestigationState>): void {
    this.state.next({ ...this.state.value, ...change });
  }
}
