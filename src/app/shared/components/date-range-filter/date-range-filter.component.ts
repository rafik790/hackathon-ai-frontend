import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

export type DateRangeForm = FormGroup<{
  start: FormControl<Date | null>;
  end: FormControl<Date | null>;
}>;

export function createDateRangeForm(): DateRangeForm {
  return new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}

/** Calendar date range bound to a reactive form group (start/end, both optional). */
@Component({
  selector: 'app-date-range-filter',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="compact-field date-field">
      <mat-label>{{ label }}</mat-label>
      <mat-date-range-input [formGroup]="group" [rangePicker]="picker" [max]="today">
        <input matStartDate formControlName="start" placeholder="From" />
        <input matEndDate formControlName="end" placeholder="To" />
      </mat-date-range-input>
      <button
        *ngIf="group.value.start || group.value.end"
        matSuffix
        mat-icon-button
        type="button"
        aria-label="Clear dates"
        (click)="group.reset()"
      >
        <mat-icon>close</mat-icon>
      </button>
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-date-range-picker #picker></mat-date-range-picker>
    </mat-form-field>
  `,
  styles: [`.date-field { width: 260px; max-width: 100%; }`],
})
export class DateRangeFilterComponent {
  @Input({ required: true }) group!: DateRangeForm;
  @Input() label = 'Started between';

  readonly today = new Date();
}
