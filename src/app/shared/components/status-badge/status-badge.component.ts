import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { statusPresentation } from '../../utils/status';

/** Coloured pill for execution, health and collector statuses. */
@Component({
  selector: 'app-status-badge',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="'badge tone-' + view.tone + ' size-' + size" [attr.aria-label]="'Status: ' + view.label">
      <span class="dot" [class.pulse]="isRunning" aria-hidden="true"></span>
      {{ label ?? view.label }}
    </span>
  `,
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: string | null | undefined = null;
  /** Overrides the default label. */
  @Input() label: string | null = null;
  @Input() size: 'sm' | 'md' = 'md';

  get view(): ReturnType<typeof statusPresentation> {
    return statusPresentation(this.status);
  }

  get isRunning(): boolean {
    return ['RUNNING', 'PROCESSING'].includes((this.status ?? '').toUpperCase());
  }
}
