import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TIME_RANGE_PRESETS, TimeRangePreset } from '../../../core/models/dashboard.models';

/** Segmented control for the backend's dashboard time presets (24h, 7d, 30d). */
@Component({
  selector: 'app-time-range-selector',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-button-toggle-group
      class="segmented"
      [value]="value"
      (change)="valueChange.emit($event.value)"
      aria-label="Time range"
      hideSingleSelectionIndicator
    >
      <mat-button-toggle *ngFor="let preset of presets" [value]="preset.value" [matTooltip]="preset.label">
        {{ preset.value }}
      </mat-button-toggle>
    </mat-button-toggle-group>
  `,
})
export class TimeRangeSelectorComponent {
  @Input() value: TimeRangePreset = '7d';
  @Output() readonly valueChange = new EventEmitter<TimeRangePreset>();

  readonly presets = TIME_RANGE_PRESETS;
}
