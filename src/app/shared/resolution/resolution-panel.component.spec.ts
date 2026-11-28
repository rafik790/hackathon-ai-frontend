import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NEVER, of, throwError } from 'rxjs';
import { Resolution, ResolutionHistoryEntry, ResolutionUpdate } from '../../core/models/resolution.models';
import { NotificationService } from '../../core/services/notification.service';
import { ResolutionApiService } from '../../core/services/resolution-api.service';
import { ResolutionPanelComponent } from './resolution-panel.component';
import { resolvedPercent, statusActions } from './resolution-presentation';
import { ResolutionUiModule } from './resolution-ui.module';
import { ResolutionStore } from './resolution.store';
import { FIX_IN_PROGRESS, HISTORY, PIPELINE, resolution } from './testing/resolution.fixtures';

describe('ResolutionPanelComponent', () => {
  let api: jasmine.SpyObj<ResolutionApiService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let dialogResult: ResolutionUpdate | undefined;
  let fixture: ComponentFixture<ResolutionPanelComponent>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ResolutionApiService>('api', ['get', 'updateTaskRun', 'history', 'summaries']);
    notifications = jasmine.createSpyObj<NotificationService>('notifications', ['info', 'error']);
    dialog = jasmine.createSpyObj<MatDialog>('dialog', ['open']);
    dialogResult = undefined;
    dialog.open.and.callFake((() => ({ afterClosed: () => of(dialogResult) })) as unknown as MatDialog['open']);
    TestBed.configureTestingModule({
      imports: [ResolutionUiModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        ResolutionStore,
        { provide: ResolutionApiService, useValue: api },
        { provide: NotificationService, useValue: notifications },
        { provide: MatDialog, useValue: dialog },
      ],
    });
  });

  afterEach(() => fixture.destroy());

  const render = (value: Resolution | null, history: ResolutionHistoryEntry[] = [], kind: 'TASK_RUN' | 'PIPELINE_RUN' = 'TASK_RUN'): HTMLElement => {
    api.get.and.returnValue(value === null ? NEVER : of(value));
    api.history.and.returnValue(of(history));
    fixture = TestBed.createComponent(ResolutionPanelComponent);
    fixture.componentRef.setInput('target', { kind, id: kind === 'TASK_RUN' ? 52 : 3 });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const text = (element: HTMLElement, selector: string): string => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const texts = (element: HTMLElement, selector: string): string[] =>
    Array.from(element.querySelectorAll(selector)).map((e) => e.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  const button = (element: HTMLElement, label: string): HTMLButtonElement | undefined =>
    Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.includes(label));
  const actionLabels = (element: HTMLElement): string[] => texts(element, '.status-action').map((label) => label.replace(/^\w+(?=[A-Z])/, ''));

  // ---------------------------------------------------------------- TaskRun

  it('shows the execution status and the resolution status separately', () => {
    const element = render(FIX_IN_PROGRESS, HISTORY);

    expect(text(element, 'h2')).toBe('Resolution');
    expect(texts(element, '.status-box .eyebrow')).toEqual(['Execution (Tekton)', 'Resolution']);
    expect(text(element, '.status-box:not(.resolution-box) app-status-badge')).toContain('Failed');
    expect(text(element, '.resolution-box app-status-badge')).toContain('Fix in progress');
    expect(text(element, '.facts .team')).toBe('dnsDevOps / Platform');
    expect(text(element, '.facts')).toContain('Priya');
    expect(text(element, '.facts')).toContain('by priya');
    expect(text(element, '.summary')).toBe(FIX_IN_PROGRESS.summary!);
    expect(text(element, '.notes')).toBe(FIX_IN_PROGRESS.notes!);
    expect(element.querySelector('.taskruns')).toBeNull();
    expect(element.querySelector('.derived')).toBeNull();
  });

  it('offers an action for each allowed transition', () => {
    const element = render(resolution(), []);
    expect(actionLabels(element)).toEqual(['Start investigation', 'Mark fix in progress']);
    expect(text(element, '.untracked')).toBe('No one has worked on it yet.');
    expect(button(element, 'Edit details')).toBeDefined();

    expect(statusActions(['RESOLVED']).map((a) => a.label)).toEqual(['Mark resolved']);
    expect(statusActions(['REOPENED']).map((a) => a.label)).toEqual(['Reopen']);
  });

  it('opens the dialog for the chosen transition and saves the TaskRun resolution', () => {
    const element = render(FIX_IN_PROGRESS, HISTORY);
    const resolved = { ...FIX_IN_PROGRESS, status: 'RESOLVED', version: 2, nextStatuses: ['REOPENED'] } as Resolution;
    api.updateTaskRun.and.returnValue(of(resolved));
    dialogResult = { status: 'RESOLVED', comment: 'Verified after rerun' };

    button(element, 'Mark resolved')!.click();
    fixture.detectChanges();

    const data = dialog.open.calls.mostRecent().args[1]?.data as { prefill: ResolutionUpdate };
    expect(data.prefill.status).toBe('RESOLVED');
    expect(api.updateTaskRun).toHaveBeenCalledOnceWith(52, { status: 'RESOLVED', comment: 'Verified after rerun', version: 1 });
    expect(notifications.info).toHaveBeenCalledOnceWith('Resolution set to Resolved');
    expect(text(element, '.resolution-box')).toContain('Resolved');
    expect(actionLabels(element)).toEqual(['Reopen']);
  });

  it('edits the details without changing the status, and changes nothing when cancelled', () => {
    const element = render(FIX_IN_PROGRESS);

    button(element, 'Edit details')!.click();

    expect(dialog.open.calls.mostRecent().args[1]?.data).not.toEqual(jasmine.objectContaining({ prefill: jasmine.anything() }));
    expect(api.updateTaskRun).not.toHaveBeenCalled();
  });

  it('shows the history, oldest first, with its notes', () => {
    const element = render(FIX_IN_PROGRESS, HISTORY);

    expect(text(element, '.history summary')).toContain('Resolution history (2)');
    expect(texts(element, '.history li .note')).toEqual(['Looking at the agent report']);
    expect(texts(element, '.history .when')[1]).toContain('unknown');
    expect(element.querySelector('.history .task')).toBeNull();
  });

  it('says there is nothing to resolve for a TaskRun that has not failed', () => {
    const element = render(resolution({ status: null, nextStatuses: [], executionStatus: 'SUCCEEDED' }));

    expect(element.textContent).toContain('Nothing to resolve');
    expect(element.querySelectorAll('.status-action').length).toBe(0);
  });

  it('shows loading and error states', () => {
    const element = render(null);
    expect(element.querySelector('app-loading-skeleton')).not.toBeNull();
    expect(element.querySelectorAll('.status-action').length).toBe(0);

    api.get.and.returnValue(throwError(() => ({ status: 503, title: 'Error', message: 'Database temporarily unavailable', path: null, fieldErrors: [] })));
    TestBed.inject(ResolutionStore).reload();
    fixture.detectChanges();
    expect(element.querySelector('app-error-state')).not.toBeNull();
    expect(element.querySelector('app-loading-skeleton')).toBeNull();
  });

  it('shows why a change was refused', () => {
    const element = render(FIX_IN_PROGRESS);
    api.updateTaskRun.and.returnValue(throwError(() => ({ status: 409, title: 'Conflict', message: 'The resolution was changed by someone else', path: null, fieldErrors: [] })));
    dialogResult = { status: 'RESOLVED' };

    button(element, 'Mark resolved')!.click();
    fixture.detectChanges();

    expect(text(element, '.inline-alert')).toContain('The resolution was changed by someone else');
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------- PipelineRun

  it('shows the PipelineRun resolution as a read-only summary of its failed TaskRuns', () => {
    const element = render(PIPELINE, HISTORY, 'PIPELINE_RUN');

    expect(text(element, 'h2')).toBe('Resolution summary');
    expect(text(element, '.derived')).toContain('Automatic');
    expect(element.querySelectorAll('button.status-action').length).toBe(0);
    expect(button(element, 'Edit details')).toBeUndefined();
    expect(text(element, '.resolution-box .eyebrow')).toBe('Resolution (all failed TaskRuns)');
    expect(text(element, '.resolution-box app-status-badge')).toContain('Open');
    expect(texts(element, '.count .value')).toEqual(['2', '1', '1']);
    expect(texts(element, '.count .eyebrow')).toEqual(['Failed', 'Resolved', 'Unresolved']);
    expect(texts(element, '.by-status span')).toEqual(['Open: 1']);
    expect(element.querySelector('.meter')?.getAttribute('aria-valuenow')).toBe('50');
    expect(text(element, '.summary')).toBe('1 of 2 failed TaskRuns resolved');
  });

  it('lists each failed TaskRun with a link to its resolution', () => {
    const element = render(PIPELINE, HISTORY, 'PIPELINE_RUN');

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('a')?.getAttribute('href')).toBe('/task-runs/52#resolution');
    expect(rows[0].textContent).toContain('Resolved');
    expect(rows[0].textContent).toContain('DevOps / Platform');
    expect(rows[1].querySelector('a')).toBeNull();
    expect(rows[1].textContent).toContain('(no longer stored)');
    expect(texts(element, '.history .task')).toEqual(['demo-app-build-bb7hj-deploy', 'demo-app-build-bb7hj-deploy']);
  });

  it('follows the TaskRuns when it is reloaded', () => {
    const element = render(PIPELINE, [], 'PIPELINE_RUN');
    const allResolved = {
      ...PIPELINE,
      status: 'RESOLVED',
      resolvedAt: '2026-11-28T11:00:00Z',
      taskRuns: { ...PIPELINE.taskRuns!, resolvedTaskRuns: 2, unresolvedTaskRuns: 0, byStatus: { RESOLVED: 2 },
        items: PIPELINE.taskRuns!.items.map((item) => ({ ...item, status: 'RESOLVED' as const })) },
    } as Resolution;
    api.get.and.returnValue(of(allResolved));

    TestBed.inject(ResolutionStore).reload();
    fixture.detectChanges();

    expect(text(element, '.resolution-box app-status-badge')).toContain('Resolved');
    expect(texts(element, '.count .value')).toEqual(['2', '2', '0']);
    expect(element.querySelector('.by-status')).toBeNull();
    expect(text(element, '.facts')).toContain('Resolved');
  });

  it('says there is nothing to resolve for a PipelineRun without failed TaskRuns', () => {
    const element = render(resolution({ ...PIPELINE, status: null, taskRuns: { failedTaskRuns: 0, resolvedTaskRuns: 0, unresolvedTaskRuns: 0, byStatus: {}, items: [] } }),
      [], 'PIPELINE_RUN');

    expect(element.textContent).toContain('This PipelineRun has no failed TaskRuns.');
  });
});

describe('resolution presentation', () => {
  it('computes the share of resolved TaskRuns', () => {
    expect(resolvedPercent(PIPELINE.taskRuns)).toBe(50);
    expect(resolvedPercent({ ...PIPELINE.taskRuns!, failedTaskRuns: 3, resolvedTaskRuns: 1, unresolvedTaskRuns: 2 })).toBe(33);
    expect(resolvedPercent({ ...PIPELINE.taskRuns!, failedTaskRuns: 0, resolvedTaskRuns: 0, unresolvedTaskRuns: 0 })).toBe(100);
    expect(resolvedPercent(null)).toBe(100);
  });
});
