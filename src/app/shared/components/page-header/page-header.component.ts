import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Page title block. Project `[pageActions]` for buttons on the right and `[pageMeta]` for
 * status chips under the description.
 */
@Component({
  selector: 'app-page-header',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="text">
        <div class="title-row">
          <ng-content select="[pageIcon]"></ng-content>
          <h1>{{ title }}</h1>
          <ng-content select="[pageTitleSuffix]"></ng-content>
        </div>
        <p class="description" *ngIf="description">{{ description }}</p>
        <div class="meta"><ng-content select="[pageMeta]"></ng-content></div>
      </div>
      <div class="actions"><ng-content select="[pageActions]"></ng-content></div>
    </header>
  `,
  styles: [
    `
      @use 'tokens' as t;
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: t.$space-4;
        flex-wrap: wrap;
        margin-bottom: t.$space-5;
      }
      .text { min-width: 0; flex: 1 1 320px; }
      .title-row { display: flex; align-items: center; gap: t.$space-3; flex-wrap: wrap; min-width: 0; }
      h1 { font-size: t.$fs-2xl; line-height: 1.25; letter-spacing: -0.01em; word-break: break-word; }
      .description { margin: t.$space-1 0 0; color: t.$text-secondary; font-size: t.$fs-md; }
      .meta { display: flex; flex-wrap: wrap; align-items: center; gap: t.$space-2 t.$space-4; margin-top: t.$space-3; }
      .meta:empty { display: none; }
      .actions { display: flex; align-items: center; flex-wrap: wrap; gap: t.$space-2; }
    `,
  ],
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() description: string | null = null;
}
