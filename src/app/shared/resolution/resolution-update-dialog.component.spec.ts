import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Resolution } from '../../core/models/resolution.models';
import { ResolutionDialogData, ResolutionUpdateDialogComponent } from './resolution-update-dialog.component';
import { ResolutionUiModule } from './resolution-ui.module';
import { FIX_IN_PROGRESS } from './testing/resolution.fixtures';

describe('ResolutionUpdateDialogComponent', () => {
  let ref: jasmine.SpyObj<MatDialogRef<ResolutionUpdateDialogComponent>>;
  let fixture: ComponentFixture<ResolutionUpdateDialogComponent>;

  const open = (data: ResolutionDialogData): ResolutionUpdateDialogComponent => {
    ref = jasmine.createSpyObj<MatDialogRef<ResolutionUpdateDialogComponent>>('ref', ['close']);
    TestBed.configureTestingModule({
      imports: [ResolutionUiModule, NoopAnimationsModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: data }, { provide: MatDialogRef, useValue: ref }],
    });
    fixture = TestBed.createComponent(ResolutionUpdateDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  afterEach(() => {
    fixture.destroy();
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  it('offers only the current status and the allowed transitions', () => {
    const dialog = open({ resolution: FIX_IN_PROGRESS });

    expect(dialog.statuses).toEqual(['FIX_IN_PROGRESS', 'RESOLVED']);
    expect(dialog.form.controls.status.value).toBe('FIX_IN_PROGRESS');
    expect(dialog.form.controls.assignedTeam.value).toBe('DEVOPS_PLATFORM');
    expect(dialog.form.controls.summary.value).toBe(FIX_IN_PROGRESS.summary!);
  });

  it('closes with the change, trimmed', () => {
    const dialog = open({ resolution: FIX_IN_PROGRESS });
    dialog.form.patchValue({ status: 'RESOLVED', comment: '  Verified after rerun ', changedBy: ' priya ' });

    dialog.save();

    expect(ref.close).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      status: 'RESOLVED', comment: 'Verified after rerun', changedBy: 'priya', assignedTeam: 'DEVOPS_PLATFORM',
    }));
  });

  it('starts from a suggestion but leaves the decision to the person', () => {
    const dialog = open({ resolution: { ...FIX_IN_PROGRESS, status: 'OPEN', nextStatuses: ['INVESTIGATING', 'FIX_IN_PROGRESS'] } as Resolution,
      prefill: { status: 'INVESTIGATING', assignedTeam: 'DEVELOPER' }, hint: 'Suggested by AI agent investigation #7.' });

    expect(dialog.form.controls.status.value).toBe('INVESTIGATING');
    expect(dialog.form.controls.assignedTeam.value).toBe('DEVELOPER');
    expect((fixture.nativeElement as HTMLElement).querySelector('.hint')?.textContent).toContain('Suggested by AI agent investigation #7.');
    expect(ref.close).not.toHaveBeenCalled();
  });

  it('titles the dialog with the chosen transition', () => {
    const dialog = open({ resolution: FIX_IN_PROGRESS, prefill: { status: 'RESOLVED' } });

    expect(dialog.statusChanges).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('h2')?.textContent).toContain('Resolved');
    dialog.form.patchValue({ status: 'FIX_IN_PROGRESS' });
    expect(dialog.statusChanges).toBeFalse();
  });
});
