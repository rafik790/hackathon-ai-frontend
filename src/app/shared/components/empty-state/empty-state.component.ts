import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Friendly "nothing here" message; project buttons as content. */
@Component({
  selector: 'app-empty-state',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty" [class.compact]="compact">
      <span class="icon" aria-hidden="true"><mat-icon>{{ icon }}</mat-icon></span>
      <h3>{{ title }}</h3>
      <p *ngIf="message">{{ message }}</p>
      <div class="actions"><ng-content></ng-content></div>
    </div>
  `,
  styles: [
    `
      @use 'tokens' as t;
      .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: t.$space-10 t.$space-6; }
      .empty.compact { padding: t.$space-6 t.$space-4; }
      .icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 44px; height: 44px; border-radius: 50%;
        background: t.$gray-100; color: t.$gray-500; margin-bottom: t.$space-3;
      }
      h3 { font-size: t.$fs-md; font-weight: t.$fw-semibold; }
      p { margin: t.$space-1 0 0; max-width: 420px; color: t.$text-muted; font-size: t.$fs-base; }
      .actions { margin-top: t.$space-4; display: flex; gap: t.$space-2; }
      .actions:empty { display: none; }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input({ required: true }) title = '';
  @Input() message: string | null = null;
  @Input() compact = false;
}
