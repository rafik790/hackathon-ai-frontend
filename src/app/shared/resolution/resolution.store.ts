import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, forkJoin, takeUntil } from 'rxjs';
import { ApiError } from '../../core/models/api-error.model';
import { toApiError } from '../../core/models/load-state';
import {
  Resolution,
  ResolutionHistoryEntry,
  ResolutionTargetKind,
  ResolutionUpdate,
} from '../../core/models/resolution.models';
import { ResolutionApiService } from '../../core/services/resolution-api.service';

export interface ResolutionTarget {
  readonly kind: ResolutionTargetKind;
  readonly id: number;
}

export interface ResolutionState {
  readonly loading: boolean;
  readonly resolution: Resolution | null;
  readonly history: readonly ResolutionHistoryEntry[];
  /** Reading failed; what is known stays visible. */
  readonly error: ApiError | null;
  readonly saving: boolean;
  readonly saveError: ApiError | null;
}

const INITIAL_STATE: ResolutionState = { loading: true, resolution: null, history: [], error: null, saving: false, saveError: null };

/**
 * Resolution of one run and its history. Provided by the run's detail page, so that the resolution panel and an
 * applied AI suggestion work on the same state. Only a TaskRun resolution can be changed, and only on request;
 * a PipelineRun resolution is derived from its TaskRuns and only read.
 */
@Injectable()
export class ResolutionStore implements OnDestroy {
  private readonly state = new BehaviorSubject<ResolutionState>(INITIAL_STATE);
  private readonly savedSubject = new Subject<Resolution>();
  private readonly destroyed$ = new Subject<void>();
  private target: ResolutionTarget | null = null;
  /** Responses that belong to an earlier target are ignored. */
  private version = 0;

  readonly state$: Observable<ResolutionState> = this.state.asObservable();
  /** Each change the backend accepted. */
  readonly saved$: Observable<Resolution> = this.savedSubject.asObservable();

  constructor(private readonly api: ResolutionApiService) {}

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.savedSubject.complete();
  }

  get snapshot(): ResolutionState {
    return this.state.value;
  }

  setTarget(target: ResolutionTarget): void {
    if (this.target && this.target.kind === target.kind && this.target.id === target.id) {
      return;
    }
    this.target = target;
    this.version++;
    this.state.next(INITIAL_STATE);
    this.load();
  }

  /** Reads the resolution and its history again. */
  reload(): void {
    if (this.target) {
      this.patch({ loading: true });
      this.load();
    }
  }

  /**
   * Sends a change of a TaskRun resolution. {@code basedOn} is the version the person saw when they started the change
   * (default: the one shown now), so a change made meanwhile by someone else is reported as a conflict, not overwritten.
   */
  update(change: ResolutionUpdate, basedOn?: number | null): void {
    const target = this.target;
    const resolution = this.state.value.resolution;
    if (!target || target.kind !== 'TASK_RUN' || !resolution || this.state.value.saving) {
      return;
    }
    const version = this.version;
    this.patch({ saving: true, saveError: null });
    this.api
      .updateTaskRun(target.id, { ...change, version: basedOn === undefined ? resolution.version : basedOn })
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (saved) => {
          if (version === this.version) {
            this.patch({ saving: false, resolution: saved });
            this.savedSubject.next(saved);
            this.loadHistory();
          }
        },
        error: (error: unknown) => {
          if (version === this.version) {
            const apiError = toApiError(error);
            this.patch({ saving: false, saveError: apiError });
            if (apiError.status === 409) {
              // Someone else changed it, or the transition is no longer possible: show what is current.
              this.load();
            }
          }
        },
      });
  }

  clearSaveError(): void {
    this.patch({ saveError: null });
  }

  private load(): void {
    const target = this.target;
    if (!target) {
      return;
    }
    const version = this.version;
    forkJoin({ resolution: this.api.get(target.kind, target.id), history: this.api.history(target.kind, target.id) })
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: ({ resolution, history }) => {
          if (version === this.version) {
            this.patch({ loading: false, resolution, history, error: null });
          }
        },
        error: (error: unknown) => {
          if (version === this.version) {
            this.patch({ loading: false, error: toApiError(error) });
          }
        },
      });
  }

  private loadHistory(): void {
    const target = this.target;
    if (!target) {
      return;
    }
    const version = this.version;
    this.api
      .history(target.kind, target.id)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (history) => version === this.version && this.patch({ history }),
        // The change itself succeeded; a failed history read only keeps the older list.
        error: () => undefined,
      });
  }

  private patch(change: Partial<ResolutionState>): void {
    this.state.next({ ...this.state.value, ...change });
  }
}
