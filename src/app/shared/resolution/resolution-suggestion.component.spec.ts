import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AgentInvestigation } from '../../core/models/agent-investigation.models';
import { Resolution, ResolutionUpdate } from '../../core/models/resolution.models';
import { ResolutionApiService } from '../../core/services/resolution-api.service';
import { RBAC_COMPLETED, investigation } from '../../features/task-runs/testing/agent-investigation.fixtures';
import { ResolutionSuggestionComponent } from './resolution-suggestion.component';
import { ResolutionUiModule } from './resolution-ui.module';
import { ResolutionStore } from './resolution.store';
import { FIX_IN_PROGRESS, resolution } from './testing/resolution.fixtures';

describe('ResolutionSuggestionComponent', () => {
  let api: jasmine.SpyObj<ResolutionApiService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let dialogResult: ResolutionUpdate | undefined;
  let fixture: ComponentFixture<ResolutionSuggestionComponent>;

  const render = (current: Resolution, of_: AgentInvestigation, withStore = true): HTMLElement => {
    api = jasmine.createSpyObj<ResolutionApiService>('api', ['get', 'updateTaskRun', 'history', 'summaries']);
    api.get.and.returnValue(of(current));
    api.history.and.returnValue(of([]));
    api.updateTaskRun.and.returnValue(of(current));
    dialog = jasmine.createSpyObj<MatDialog>('dialog', ['open']);
    dialogResult = undefined;
    dialog.open.and.callFake((() => ({ afterClosed: () => of(dialogResult) })) as unknown as MatDialog['open']);
    TestBed.configureTestingModule({
      imports: [ResolutionUiModule, NoopAnimationsModule],
      providers: [
        ...(withStore ? [ResolutionStore] : []),
        { provide: ResolutionApiService, useValue: api },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    if (withStore) {
      TestBed.inject(ResolutionStore).setTarget({ kind: 'TASK_RUN', id: 52 });
    }
    fixture = TestBed.createComponent(ResolutionSuggestionComponent);
    fixture.componentRef.setInput('investigation', of_);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => fixture.destroy());

  const text = (element: HTMLElement, selector: string): string => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  it('suggests investigating with the responsible team and only offers it', () => {
    const element = render(resolution(), RBAC_COMPLETED);

    expect(text(element, '.suggest p')).toBe('Suggested for the TaskRun resolution: Investigating, assigned to DevOps / Platform');
    // Only the offer: the resolution itself is shown in its own section.
    expect(element.querySelector('app-status-badge')).toBeNull();
    expect(api.updateTaskRun).not.toHaveBeenCalled();
  });

  it('applies the suggestion to the TaskRun resolution only when the person saves it', () => {
    const element = render(resolution(), RBAC_COMPLETED);

    (element.querySelector('.suggest button') as HTMLButtonElement).click();
    const data = dialog.open.calls.mostRecent().args[1]?.data as { prefill: ResolutionUpdate; hint: string };
    expect(data.prefill).toEqual(jasmine.objectContaining({ status: 'INVESTIGATING', assignedTeam: 'DEVOPS_PLATFORM' }));
    expect(data.hint).toContain('Nothing changes until you save');
    expect(api.updateTaskRun).not.toHaveBeenCalled();

    dialogResult = { status: 'INVESTIGATING', assignedTeam: 'DEVOPS_PLATFORM' };
    (element.querySelector('.suggest button') as HTMLButtonElement).click();
    expect(api.updateTaskRun).toHaveBeenCalledOnceWith(52, { status: 'INVESTIGATING', assignedTeam: 'DEVOPS_PLATFORM', version: null });
  });

  it('suggests nothing while the investigation runs or the fix is under way with a team', () => {
    expect(render(resolution(), investigation('RUNNING')).querySelector('.suggest')).toBeNull();
    fixture.destroy();
    TestBed.resetTestingModule();
    expect(render(FIX_IN_PROGRESS, RBAC_COMPLETED).querySelector('.suggest')).toBeNull();
  });

  it('suggests the team when the work started without one', () => {
    const element = render(resolution({ tracked: true, status: 'INVESTIGATING', nextStatuses: ['FIX_IN_PROGRESS', 'RESOLVED'], version: 0 }),
      RBAC_COMPLETED);

    expect(text(element, '.suggest p')).toContain('Assign to DevOps / Platform');
  });

  it('renders nothing without a resolution on the page', () => {
    expect(render(resolution(), RBAC_COMPLETED, false).querySelector('.suggest')).toBeNull();
  });
});
