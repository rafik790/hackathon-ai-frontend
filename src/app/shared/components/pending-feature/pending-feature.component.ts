import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Placeholder for a capability the backend does not expose yet. States plainly that integration
 * is pending and lists what will appear; it never shows sample or invented data.
 */
@Component({
  selector: 'app-pending-feature',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pending" [class.compact]="compact">
      <div class="head">
        <span class="icon" aria-hidden="true"><mat-icon>{{ icon }}</mat-icon></span>
        <div class="text">
          <div class="title-row">
            <h3>{{ title }}</h3>
            <span class="chip">Awaiting backend support</span>
          </div>
          <p>{{ description }}</p>
        </div>
      </div>
      <ul *ngIf="items.length">
        <li *ngFor="let item of items"><mat-icon aria-hidden="true">radio_button_unchecked</mat-icon>{{ item }}</li>
      </ul>
    </section>
  `,
  styles: [
    `
      @use 'tokens' as t;
      :host { display: block; }
      .pending {
        border: 1px dashed t.$border-strong;
        border-radius: t.$radius-lg;
        background: t.$surface-subtle;
        padding: t.$space-5;
        height: 100%;
      }
      .pending.compact { padding: t.$space-4; }
      .head { display: flex; gap: t.$space-3; align-items: flex-start; }
      .icon {
        display: inline-flex; align-items: center; justify-content: center; flex: none;
        width: 36px; height: 36px; border-radius: t.$radius-md; background: t.$gray-100; color: t.$gray-500;
      }
      .title-row { display: flex; align-items: center; gap: t.$space-2; flex-wrap: wrap; }
      h3 { font-size: t.$fs-md; }
      .chip {
        font-size: t.$fs-xs; font-weight: t.$fw-semibold; letter-spacing: 0.02em;
        color: #b54708; background: t.$warning-bg; border: 1px solid t.$warning-border;
        padding: 2px 8px; border-radius: t.$radius-pill;
      }
      p { margin: t.$space-1 0 0; color: t.$text-secondary; font-size: t.$fs-base; }
      ul { margin: t.$space-4 0 0; padding: 0 0 0 48px; list-style: none; display: grid; gap: t.$space-2; }
      li { display: flex; align-items: center; gap: t.$space-2; font-size: t.$fs-base; color: t.$text-muted; }
      li .mat-icon { font-size: 14px; width: 14px; height: 14px; color: t.$gray-400; }
    `,
  ],
})
export class PendingFeatureComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() icon = 'construction';
  @Input() items: readonly string[] = [];
  @Input() compact = false;
}
