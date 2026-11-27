import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AgentInvestigation, AgentInvestigationStep } from '../../../../core/models/agent-investigation.models';
import { AgentInvestigationApiService } from '../../../../core/services/agent-investigation-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SharedModule } from '../../../../shared/shared.module';
import { COMPLETED, LOG_STEP, REJECTED_STEP, REPORT_STEP, TARGET, apiError, investigation, page } from '../../testing/agent-investigation.fixtures';
import { AgentInvestigationPanelComponent } from './agent-investigation-panel.component';

describe('AgentInvestigationPanelComponent', () => {
  let api: jasmine.SpyObj<AgentInvestigationApiService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let fixture: ComponentFixture<AgentInvestigationPanelComponent>;

  beforeEach(() => {
    api = jasmine.createSpyObj<AgentInvestigationApiService>('api', ['start', 'get', 'steps', 'list']);
    notifications = jasmine.createSpyObj<NotificationService>('notifications', ['info', 'error']);
    TestBed.configureTestingModule({
      declarations: [AgentInvestigationPanelComponent],
      imports: [SharedModule, NoopAnimationsModule],
      providers: [
        { provide: AgentInvestigationApiService, useValue: api },
        { provide: NotificationService, useValue: notifications },
      ],
    });
  });

  afterEach(() => fixture.destroy());

  const render = (latest: AgentInvestigation | null, steps: AgentInvestigationStep[] = []): HTMLElement => {
    api.list.and.returnValue(of(latest ? page(latest) : page()));
    if (latest) {
      api.get.and.returnValue(of(latest));
    }
    api.steps.and.returnValue(of(steps));
    fixture = TestBed.createComponent(AgentInvestigationPanelComponent);
    fixture.componentRef.setInput('target', TARGET);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const button = (element: HTMLElement): HTMLButtonElement =>
    Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.includes('Investigate with AI Agent')) as HTMLButtonElement;
  const text = (element: HTMLElement, selector: string): string => element.querySelector(selector)?.textContent?.trim() ?? '';
  const texts = (element: HTMLElement, selector: string): string[] =>
    Array.from(element.querySelectorAll(selector)).map((e) => e.textContent?.replace(/\s+/g, ' ').trim() ?? '');

  it('offers an investigation when there is none yet', () => {
    const element = render(null);

    expect(text(element, 'h2')).toBe('AI Agent Investigation');
    expect(element.textContent).toContain('Not investigated yet');
    expect(button(element).disabled).toBeFalse();
  });

  it('starts an investigation of the TaskRun on click and confirms it', () => {
    const element = render(null);
    api.start.and.returnValue(of(investigation('PENDING')));
    api.get.and.returnValue(of(investigation('RUNNING')));

    button(element).click();
    fixture.detectChanges();

    expect(api.start).toHaveBeenCalledOnceWith({ taskRunName: TARGET.name, namespace: TARGET.namespace });
    expect(notifications.info).toHaveBeenCalledOnceWith('AI agent investigation #7 started');
    expect(button(element).disabled).toBeTrue();
    expect(element.querySelector('mat-progress-bar')).not.toBeNull();
    expect(text(element, '.facts')).toContain('#7');
    expect(text(element, '.facts')).toContain(TARGET.name);
  });

  it('shows the steps of the agent as a timeline', () => {
    const element = render(investigation('RUNNING', { stepCount: 2, toolCallCount: 1 }), [LOG_STEP, REJECTED_STEP]);

    expect(texts(element, '.timeline .tool')).toEqual(['TaskRun logs', 'Deployment status', 'Choosing the next step…']);
    expect(texts(element, '.timeline .number')).toEqual(['Step 1', 'Step 2']);
    expect(text(element, '#agent-step-1 .resource')).toBe(`${TARGET.name} in ${TARGET.namespace}`);
    expect(text(element, '#agent-step-1 .reasoning')).toBe(LOG_STEP.reasoning ?? '');
    expect(text(element, '#agent-step-1 details pre')).toContain('"name": "step-build"');
    expect(text(element, '#agent-step-2 .refusal')).toContain('Namespace kube-system is not monitored');
    expect(element.querySelector('#agent-step-2')?.classList).toContain('status-rejected');
    expect(element.querySelector('.report')).toBeNull();
  });

  it('shows the final report with its evidence and allows a new investigation', () => {
    const element = render(COMPLETED, [LOG_STEP, REPORT_STEP]);

    expect(text(element, '.report .summary')).toBe(COMPLETED.report?.summary ?? '');
    expect(text(element, '.root-cause p')).toBe(COMPLETED.report?.rootCause ?? '');
    expect(text(element, '.ratings')).toContain('90%');
    expect(texts(element, '.evidence .step-ref')).toEqual(['Step 1']);
    expect(texts(element, '.evidence pre')).toEqual(['error: cannot find symbol']);
    expect(texts(element, '.actions li')).toEqual(['Fix the compile error in OrderService and push again.']);
    expect(text(element, '.report .note')).toContain('1 evidence item was removed');
    expect(texts(element, '.timeline .tool')).toEqual(['TaskRun logs', 'Final report']);
    expect(element.querySelector('mat-progress-bar')).toBeNull();
    expect(button(element).disabled).toBeFalse();
  });

  it('explains a failed investigation', () => {
    const element = render(investigation('FAILED', { errorMessage: 'The step limit of 8 was reached' }));

    expect(text(element, '.inline-alert')).toContain('The step limit of 8 was reached');
    expect(element.querySelector('.report')).toBeNull();
    expect(button(element).disabled).toBeFalse();
  });

  it('shows the message of the backend when a start is refused', () => {
    const element = render(null);
    api.start.and.returnValue(throwError(() => apiError(409, 'Agent investigation is disabled; set AGENT_INVESTIGATION_ENABLED=true to use it')));

    button(element).click();
    fixture.detectChanges();

    expect(text(element, '.inline-alert')).toContain('AGENT_INVESTIGATION_ENABLED=true');
    expect(notifications.info).not.toHaveBeenCalled();
    expect(button(element).disabled).toBeFalse();
  });
});
