import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ResponsibleTeam } from '../../core/models/agent-investigation.models';
import { Resolution, ResolutionStatus, ResolutionUpdate } from '../../core/models/resolution.models';
import { TEAM_OPTIONS, resolutionLabel, teamPresentation } from './resolution-presentation';

export interface ResolutionDialogData {
  readonly resolution: Resolution;
  /** Values to start with, e.g. a suggestion of the AI agent; the person still decides. */
  readonly prefill?: Partial<ResolutionUpdate>;
  /** Shown above the form, e.g. where a suggestion comes from. */
  readonly hint?: string;
}

const CHANGED_BY_KEY = 'resolution.changedBy';

/**
 * Change of a TaskRun resolution. Open with `MatDialog.open(ResolutionUpdateDialogComponent, { data })`; closes with
 * the change, or nothing.
 */
@Component({
  selector: 'app-resolution-update-dialog',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resolution-update-dialog.component.html',
  styleUrls: ['./resolution-update-dialog.component.scss'],
})
export class ResolutionUpdateDialogComponent {
  readonly resolution = this.data.resolution;
  readonly statuses: readonly ResolutionStatus[] = [this.resolution.status!, ...this.resolution.nextStatuses];
  readonly teams = TEAM_OPTIONS;
  readonly label = resolutionLabel;
  readonly team = teamPresentation;

  readonly form = new FormGroup({
    status: new FormControl<ResolutionStatus>(this.data.prefill?.status ?? this.resolution.status!, { nonNullable: true }),
    assignedTeam: new FormControl<ResponsibleTeam | ''>(this.data.prefill?.assignedTeam ?? this.resolution.assignedTeam ?? '', {
      nonNullable: true,
    }),
    assignedPerson: new FormControl(this.resolution.assignedPerson ?? '', { nonNullable: true, validators: Validators.maxLength(128) }),
    summary: new FormControl(this.data.prefill?.summary ?? this.resolution.summary ?? '', {
      nonNullable: true,
      validators: Validators.maxLength(2000),
    }),
    notes: new FormControl(this.resolution.notes ?? '', { nonNullable: true, validators: Validators.maxLength(4000) }),
    comment: new FormControl(this.data.prefill?.comment ?? '', { nonNullable: true, validators: Validators.maxLength(4000) }),
    changedBy: new FormControl(readChangedBy(), { nonNullable: true, validators: Validators.maxLength(128) }),
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: ResolutionDialogData,
    private readonly dialog: MatDialogRef<ResolutionUpdateDialogComponent, ResolutionUpdate>,
  ) {}

  get statusChanges(): boolean {
    return this.form.controls.status.value !== this.resolution.status;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    writeChangedBy(value.changedBy.trim());
    this.dialog.close({
      status: value.status,
      assignedTeam: value.assignedTeam,
      assignedPerson: value.assignedPerson.trim(),
      summary: value.summary.trim(),
      notes: value.notes.trim(),
      comment: value.comment.trim() || null,
      changedBy: value.changedBy.trim() || null,
    });
  }
}

/** The name is remembered per browser for convenience; storage may be unavailable. */
function readChangedBy(): string {
  try {
    return localStorage.getItem(CHANGED_BY_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeChangedBy(value: string): void {
  try {
    if (value) {
      localStorage.setItem(CHANGED_BY_KEY, value);
    }
  } catch {
    // Not remembered; nothing else depends on it.
  }
}
