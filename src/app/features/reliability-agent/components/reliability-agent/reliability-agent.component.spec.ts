import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ApiError } from '../../../../core/models/api-error.model';
import { AgentMessage, ConversationDetail, ReliabilityAgentStatus } from '../../../../core/models/reliability-agent.models';
import { ReliabilityAgentApiService } from '../../../../core/services/reliability-agent-api.service';
import { SharedModule } from '../../../../shared/shared.module';
import { AGENT_POLL_MS } from '../../services/reliability-agent.store';
import { ReliabilityAgentComponent, SUGGESTED_QUESTIONS } from './reliability-agent.component';

const STATUS: ReliabilityAgentStatus = {
  enabled: true, available: true, reason: null, tools: [], limits: { maxQuestionChars: 2000 },
};

function message(change: Partial<AgentMessage> = {}): AgentMessage {
  return {
    id: 11, conversationId: 5, sequence: 1, question: 'Which PipelineRuns failed because of image pull errors?', status: 'COMPLETED',
    errorMessage: null, iterations: 3, toolCallCount: 2, durationMs: 4200, provider: 'anthropic', model: 'm', inputTokens: 1,
    outputTokens: 1, createdAt: '2026-11-28T12:00:00Z', startedAt: null, completedAt: null,
    toolCalls: [
      { id: 1, messageId: 11, sequence: 1, toolName: 'search_failed_task_runs', activity: 'Searched failed TaskRuns',
        arguments: { category: 'IMAGE_PULL', sinceDays: 7 }, status: 'SUCCEEDED', resultSummary: '{"count":1}', errorMessage: null,
        durationMs: 12, createdAt: '2026-11-28T12:00:01Z' },
      { id: 2, messageId: 11, sequence: 2, toolName: 'delete_pod', activity: 'Requested an unknown tool', arguments: { pod: 'x' },
        status: 'REJECTED', resultSummary: null, errorMessage: "unknown tool 'delete_pod'", durationMs: 0, createdAt: '2026-11-28T12:00:02Z' },
    ],
    answer: {
      answer: 'One PipelineRun failed because its image does not exist.',
      facts: [{ statement: 'deploy failed with IMAGE_PULL', toolCalls: [1] }],
      conclusions: ['The tag was never pushed'],
      recommendations: ['Push the image'],
      missingEvidence: ['Registry logs'],
      references: [
        { type: 'TASK_RUN', id: 41, name: 'build-p1-deploy', namespace: 'ci' },
        { type: 'PIPELINE_RUN', id: 14, name: 'build-p1', namespace: 'ci' },
        { type: 'FAILURE_PATTERN_ANALYSIS', id: 2, name: 'Pattern analysis #2', namespace: null },
      ],
    },
    ...change,
  };
}

function conversation(messages: AgentMessage[]): ConversationDetail {
  const last = messages[messages.length - 1];
  return { id: 5, title: 'Image pull failures', status: last?.status ?? null, messageCount: messages.length,
    createdAt: '2026-11-28T12:00:00Z', updatedAt: '2026-11-28T12:00:00Z', messages };
}

describe('ReliabilityAgentComponent', () => {
  let api: jasmine.SpyObj<ReliabilityAgentApiService>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let fixture: ComponentFixture<ReliabilityAgentComponent>;
  let navigate: jasmine.Spy;

  const render = (status: ReliabilityAgentStatus = STATUS, conversationId: number | null = null): HTMLElement => {
    api = jasmine.createSpyObj<ReliabilityAgentApiService>('api', ['status', 'start', 'followUp', 'list', 'get']);
    api.status.and.returnValue(of(status));
    api.list.and.returnValue(of({ content: [{ id: 5, title: 'Image pull failures', status: 'COMPLETED', messageCount: 1,
      createdAt: '2026-11-28T12:00:00Z', updatedAt: '2026-11-28T12:00:00Z' }], page: 0, size: 20, totalElements: 1, totalPages: 1,
    first: true, last: true, sort: null }));
    api.get.and.returnValue(of(conversation([message()])));
    params = new BehaviorSubject(convertToParamMap(conversationId ? { conversation: String(conversationId) } : {}));
    TestBed.configureTestingModule({
      declarations: [ReliabilityAgentComponent],
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: ReliabilityAgentApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { queryParamMap: params.asObservable() } },
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.callFake((_: unknown[], extras?: { queryParams?: { conversation?: number | null } }) => {
      const id = extras?.queryParams?.conversation;
      params.next(convertToParamMap(id ? { conversation: String(id) } : {}));
      return Promise.resolve(true);
    });
    fixture = TestBed.createComponent(ReliabilityAgentComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => fixture.destroy());

  const text = (element: Element | null): string => element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const askButton = (element: HTMLElement) => element.querySelector('button.ask') as HTMLButtonElement;

  it('explains that the feature is switched off and asks nothing', () => {
    const element = render({ enabled: false, available: false, reason: 'disabled', tools: [], limits: {} });

    expect(text(element)).toContain('The Reliability Agent is switched off');
    expect(element.querySelector('textarea')).toBeNull();
    expect(api.list).not.toHaveBeenCalled();
  });

  it('offers suggested questions for a new conversation and asks the chosen one', () => {
    const element = render();
    api.start.and.returnValue(of({ conversationId: 5, messageId: 11, status: 'PENDING' }));

    const suggestions = Array.from(element.querySelectorAll('button.suggestion')).map(text);
    expect(suggestions).toEqual([...SUGGESTED_QUESTIONS]);
    expect(askButton(element).disabled).toBeTrue();
    (element.querySelectorAll('button.suggestion')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    askButton(element).click();
    fixture.detectChanges();

    expect(api.start).toHaveBeenCalledOnceWith(SUGGESTED_QUESTIONS[0]);
    expect(navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { conversation: 5 } }));
    expect(api.get).toHaveBeenCalledWith(5);
    expect(fixture.componentInstance.question.value).toBe('');
  });

  it('shows the investigation activity, the structured answer and links to the runs', () => {
    const element = render(STATUS, 5);

    const steps = Array.from(element.querySelectorAll('.steps li')).map(text);
    expect(steps[0]).toContain('#1 Searched failed TaskRuns IMAGE_PULL · 7');
    expect(steps[1]).toContain("Refused: unknown tool 'delete_pod'");
    expect(steps[2]).toContain('Generated evidence-based conclusion');
    expect(element.querySelector('.steps details pre')?.textContent).toBe('{"count":1}');
    const answer = element.querySelector('.answer')!;
    expect(text(answer.querySelector('.direct'))).toBe('One PipelineRun failed because its image does not exist.');
    expect(text(answer)).toContain('Facts from tools deploy failed with IMAGE_PULL #1');
    const blocks = Array.from(answer.querySelectorAll('.block')).map((b) => [text(b.querySelector('h3')), text(b.querySelector('li'))]);
    expect(blocks).toContain(['lightbulbAgent conclusions', 'The tag was never pushed']);
    expect(blocks).toContain(['checklistRecommendations', 'Push the image']);
    expect(blocks).toContain(['help_outlineMissing or insufficient evidence', 'Registry logs']);
    const links = Array.from(answer.querySelectorAll('a.ref')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/task-runs/41', '/pipeline-runs/14', '/failure-patterns']);
    expect(element.querySelector('.item.selected')).not.toBeNull();
  });

  it('follows a running question until it is answered', fakeAsync(() => {
    const running = conversation([message({ status: 'RUNNING', answer: null, toolCalls: message().toolCalls.slice(0, 1) })]);
    const answers = [running, conversation([message()])];
    const element = render(STATUS, null);
    api.get.and.callFake(() => of(answers.shift() ?? conversation([message()])));

    params.next(convertToParamMap({ conversation: '5' }));
    fixture.detectChanges();
    expect(text(element.querySelector('.steps'))).toContain('Investigating…');
    expect(askButton(element).disabled).toBeTrue();

    tick(AGENT_POLL_MS);
    fixture.detectChanges();
    expect(text(element.querySelector('.steps'))).toContain('Generated evidence-based conclusion');
    expect(api.get).toHaveBeenCalledTimes(2);
    tick(AGENT_POLL_MS * 3);
    expect(api.get).toHaveBeenCalledTimes(2);
    discardPeriodicTasks();
  }));

  it('asks follow-ups in the open conversation and shows why a question was refused', () => {
    const element = render(STATUS, 5);
    const error: ApiError = { status: 409, title: 'Conflict', message: 'The agent is still answering question 1', path: null, fieldErrors: [] };
    api.followUp.and.returnValue(throwError(() => error));

    fixture.componentInstance.question.setValue('Which team should fix it?');
    fixture.detectChanges();
    askButton(element).click();
    fixture.detectChanges();

    expect(api.followUp).toHaveBeenCalledOnceWith(5, 'Which team should fix it?');
    expect(api.start).not.toHaveBeenCalled();
    expect(text(element.querySelector('.composer .inline-alert'))).toContain('Cannot ask now. The agent is still answering question 1');
  });

  it('shows why an answer failed', () => {
    render(STATUS, null);
    api.get.and.returnValue(of(conversation([message({ status: 'FAILED', answer: null, errorMessage: 'The daily AI quota is exhausted' })])));
    params.next(convertToParamMap({ conversation: '5' }));
    fixture.detectChanges();

    expect(text((fixture.nativeElement as HTMLElement).querySelector('.message .inline-alert'))).toContain('The daily AI quota is exhausted');
  });
});
