import { ChangeDetectionStrategy, Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error.model';
import {
  AgentMessage,
  AgentReference,
  AgentToolCall,
  ConversationSummary,
  isAgentMessageActive,
} from '../../../../core/models/reliability-agent.models';
import { ReliabilityAgentStore } from '../../services/reliability-agent.store';

/** Example questions shown for a new conversation. */
export const SUGGESTED_QUESTIONS: readonly string[] = [
  'Which PipelineRuns have failed because of image pull errors?',
  'Are there unresolved failures related to service account permissions?',
  'Why did the deployment failure happen again after resolution?',
  'Compare the last three failed PipelineRuns of demo-app-build.',
  'Which failures occurred after the latest successful deployment?',
  'What evidence suggests that the latest deploy failure is caused by RBAC?',
];

const STATUS_ICONS: Readonly<Record<AgentToolCall['status'], string>> = {
  SUCCEEDED: 'check_circle',
  FAILED: 'error',
  REJECTED: 'block',
};

/**
 * Reliability Agent page: ask questions in natural language; the agent investigates with read-only backend tools and
 * the page shows every step it took and an answer that separates facts, conclusions, recommendations and gaps.
 */
@Component({
  selector: 'app-reliability-agent',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reliability-agent.component.html',
  styleUrls: ['./reliability-agent.component.scss'],
  providers: [ReliabilityAgentStore],
})
export class ReliabilityAgentComponent implements OnInit {
  readonly state$ = this.store.state$;
  readonly suggestions = SUGGESTED_QUESTIONS;
  readonly question = new FormControl('', { nonNullable: true });

  constructor(
    private readonly store: ReliabilityAgentStore,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.store.init();
    // The open conversation lives in the URL (?conversation=), so reloads and links keep it.
    this.route.queryParamMap
      .pipe(
        map((params) => Number(params.get('conversation')) || null),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => this.store.open(id));
    this.store.accepted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((accepted) => {
      this.question.setValue('');
      this.navigate(accepted.conversationId);
    });
  }

  ask(): void {
    this.store.ask(this.question.value);
  }

  useSuggestion(question: string): void {
    this.question.setValue(question);
  }

  open(conversation: ConversationSummary): void {
    this.navigate(conversation.id);
  }

  newConversation(): void {
    this.navigate(null);
  }

  /** Ctrl+Enter or Cmd+Enter sends. */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.ask();
    }
  }

  isActive(status: string | null | undefined): boolean {
    return isAgentMessageActive(status as AgentMessage['status']);
  }

  statusIcon(call: AgentToolCall): string {
    return STATUS_ICONS[call.status] ?? 'help';
  }

  /** The names and filters the tool was asked about, e.g. "demo-app-build-x7k2p · ci". */
  target(call: AgentToolCall): string {
    return Object.values(call.arguments ?? {})
      .map((value) => (Array.isArray(value) ? value.join(', ') : String(value)))
      .filter((value) => value.length > 0)
      .slice(0, 4)
      .join(' · ');
  }

  link(reference: AgentReference): unknown[] | null {
    switch (reference.type) {
      case 'TASK_RUN':
        return reference.id === null ? null : ['/task-runs', reference.id];
      case 'PIPELINE_RUN':
        return reference.id === null ? null : ['/pipeline-runs', reference.id];
      case 'FAILURE_PATTERN_ANALYSIS':
        return ['/failure-patterns'];
      default:
        return null;
    }
  }

  referenceKind(reference: AgentReference): string {
    return reference.type === 'TASK_RUN' ? 'TaskRun' : reference.type === 'PIPELINE_RUN' ? 'PipelineRun' : 'Pattern analysis';
  }

  sendErrorTitle(error: ApiError): string {
    switch (error.status) {
      case 409:
        return 'Cannot ask now.';
      case 429:
        return 'AI quota exhausted.';
      case 400:
        return 'Check the question.';
      default:
        return 'The question could not be sent.';
    }
  }

  trackById(_: number, item: { readonly id: number }): number {
    return item.id;
  }

  private navigate(conversation: number | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { conversation },
      queryParamsHandling: 'merge',
    });
  }
}
