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
import { toApiError } from '../../../core/models/load-state';
import {
  ConversationDetail,
  ConversationSummary,
  MessageAccepted,
  ReliabilityAgentStatus,
  isAgentMessageActive,
} from '../../../core/models/reliability-agent.models';
import { ReliabilityAgentApiService } from '../../../core/services/reliability-agent-api.service';

export interface ReliabilityAgentState {
  readonly status: ReliabilityAgentStatus | null;
  readonly statusError: ApiError | null;
  readonly conversations: readonly ConversationSummary[];
  readonly conversationsError: ApiError | null;
  /** The open conversation; null for a new one. */
  readonly conversation: ConversationDetail | null;
  readonly conversationError: ApiError | null;
  readonly loadingConversation: boolean;
  readonly sending: boolean;
  readonly sendError: ApiError | null;
}

const INITIAL_STATE: ReliabilityAgentState = {
  status: null,
  statusError: null,
  conversations: [],
  conversationsError: null,
  conversation: null,
  conversationError: null,
  loadingConversation: false,
  sending: false,
  sendError: null,
};

export const AGENT_POLL_MS = 2_000;

/**
 * The Reliability Agent page: feature status, conversation list, the open conversation and asking questions. Follows
 * a conversation while its latest question is being answered, so tool activity appears as it happens. Provided per
 * component; there is never more than one polling loop.
 */
@Injectable()
export class ReliabilityAgentStore implements OnDestroy {
  private readonly state = new BehaviorSubject<ReliabilityAgentState>(INITIAL_STATE);
  private readonly follow$ = new Subject<number>();
  private readonly destroyed$ = new Subject<void>();
  private readonly acceptedSubject = new Subject<MessageAccepted>();

  readonly state$: Observable<ReliabilityAgentState> = this.state.asObservable();
  /** Each question the backend accepted. */
  readonly accepted$: Observable<MessageAccepted> = this.acceptedSubject.asObservable();

  constructor(private readonly api: ReliabilityAgentApiService, @Inject(DOCUMENT) private readonly document: Document) {
    this.follow$
      .pipe(
        // A negative id stops following (a new conversation is open).
        switchMap((id) =>
          id < 0 ? EMPTY : timer(AGENT_POLL_MS, AGENT_POLL_MS).pipe(
            startWith(-1),
            filter((tick) => tick < 0 || this.document.visibilityState !== 'hidden'),
            exhaustMap(() => this.read(id)),
            takeWhile((conversation) => isAgentMessageActive(conversation.status)),
          ),
        ),
        takeUntil(this.destroyed$),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.acceptedSubject.complete();
  }

  /** Reads the feature status and, when enabled, the conversations. */
  init(): void {
    this.api
      .status()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (status) => {
          this.patch({ status, statusError: null });
          if (status.enabled) {
            this.loadConversations();
          }
        },
        error: (error: unknown) => this.patch({ statusError: toApiError(error) }),
      });
  }

  loadConversations(): void {
    this.api
      .list()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (page) => this.patch({ conversations: page.content, conversationsError: null }),
        error: (error: unknown) => this.patch({ conversationsError: toApiError(error) }),
      });
  }

  /** Opens a conversation (null: a new one) and follows it while it is answered. */
  open(id: number | null): void {
    if (id === null) {
      this.follow$.next(-1);
      this.patch({ conversation: null, conversationError: null, loadingConversation: false, sendError: null });
      return;
    }
    if (this.state.value.conversation?.id !== id) {
      this.patch({ conversation: null, loadingConversation: true, conversationError: null, sendError: null });
    }
    this.follow$.next(id);
  }

  /** Asks in the open conversation, or starts a new one. */
  ask(question: string): void {
    const text = question.trim();
    const { sending, conversation } = this.state.value;
    if (!text || sending || (conversation && isAgentMessageActive(conversation.status))) {
      return;
    }
    this.patch({ sending: true, sendError: null });
    const request = conversation ? this.api.followUp(conversation.id, text) : this.api.start(text);
    request.pipe(takeUntil(this.destroyed$)).subscribe({
      next: (accepted) => {
        this.patch({ sending: false });
        this.follow$.next(accepted.conversationId);
        this.acceptedSubject.next(accepted);
        this.loadConversations();
      },
      error: (error: unknown) => this.patch({ sending: false, sendError: toApiError(error) }),
    });
  }

  private read(id: number): Observable<ConversationDetail> {
    return this.api.get(id).pipe(
      tap((conversation) => {
        const wasActive = isAgentMessageActive(this.state.value.conversation?.status);
        this.patch({ conversation, loadingConversation: false, conversationError: null });
        if (wasActive && !isAgentMessageActive(conversation.status)) {
          this.loadConversations();
        }
      }),
      catchError((error: unknown) => {
        const apiError = toApiError(error);
        this.patch({ loadingConversation: false, conversationError: apiError });
        if (apiError.status === 404) {
          // Nothing to follow; other errors are retried on the next tick.
          this.follow$.next(-1);
        }
        return EMPTY;
      }),
    );
  }

  private patch(change: Partial<ReliabilityAgentState>): void {
    this.state.next({ ...this.state.value, ...change });
  }
}
