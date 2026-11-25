import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { levelPresentation } from './failure-analysis-presentation';

/** Severity or priority (CRITICAL, HIGH, MEDIUM, LOW) as a coloured label. */
@Component({
  selector: 'app-level-badge',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="'level tone-' + view.tone" [attr.aria-label]="name + ': ' + view.label">
      <mat-icon aria-hidden="true">{{ view.icon }}</mat-icon>{{ view.label }}
    </span>
  `,
  styles: [
    `
      @use 'tokens' as t;
      :host { display: inline-flex; }
      .level {
        display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px 3px 5px;
        border: 1px solid transparent; border-radius: t.$radius-sm;
        font-size: t.$fs-xs; font-weight: t.$fw-semibold; line-height: 1; white-space: nowrap;
      }
      .mat-icon { font-size: 14px; width: 14px; height: 14px; }
      .tone-critical { color: t.$white; background: #b42318; }
      .tone-danger { color: #b42318; background: t.$danger-bg; border-color: t.$danger-border; }
      .tone-warning { color: #b54708; background: t.$warning-bg; border-color: t.$warning-border; }
      .tone-info { color: t.$primary-700; background: t.$info-bg; border-color: t.$info-border; }
      .tone-neutral { color: t.$gray-600; background: t.$neutral-bg; border-color: t.$neutral-border; }
    `,
  ],
})
export class LevelBadgeComponent {
  @Input({ required: true }) level: string | null = null;
  /** What the level describes, for screen readers. */
  @Input() name = 'Severity';

  get view(): ReturnType<typeof levelPresentation> {
    return levelPresentation(this.level);
  }
}
