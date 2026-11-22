import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface BreadcrumbItem {
  readonly label: string;
  /** Absolute router URL; the last item is never a link. */
  readonly url: string | null;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Breadcrumb">
      <ol>
        <li *ngFor="let item of items; let last = last">
          <a *ngIf="item.url && !last; else current" [routerLink]="item.url">{{ item.label }}</a>
          <ng-template #current><span [attr.aria-current]="last ? 'page' : null" class="current">{{ item.label }}</span></ng-template>
          <mat-icon *ngIf="!last" class="sep" aria-hidden="true">chevron_right</mat-icon>
        </li>
      </ol>
    </nav>
  `,
  styles: [
    `
      @use 'tokens' as t;
      ol { display: flex; align-items: center; flex-wrap: nowrap; gap: 2px; margin: 0; padding: 0; list-style: none; min-width: 0; }
      li { display: flex; align-items: center; gap: 2px; min-width: 0; font-size: t.$fs-base; }
      a { color: t.$text-muted; @include t.truncate; }
      a:hover { color: t.$primary-600; text-decoration: none; }
      .current { color: t.$text; font-weight: t.$fw-medium; @include t.truncate; max-width: 360px; }
      .sep { font-size: 16px; width: 16px; height: 16px; color: t.$gray-400; flex: none; }
    `,
  ],
})
export class BreadcrumbComponent {
  @Input() items: readonly BreadcrumbItem[] = [];
}
