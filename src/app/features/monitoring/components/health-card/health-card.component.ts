import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HealthDimension } from '../../models/monitoring-view.models';

@Component({
  selector: 'app-health-card',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="health card" [attr.aria-label]="dimension.title">
      <div class="top">
        <span class="icon" aria-hidden="true"><mat-icon>{{ dimension.icon }}</mat-icon></span>
        <span class="title">{{ dimension.title }}</span>
        <app-status-badge *ngIf="dimension.status" [status]="dimension.status" [label]="dimension.statusLabel" size="sm"></app-status-badge>
      </div>
      <div class="headline">{{ dimension.headline }}</div>
      <div class="detail" [attr.title]="dimension.detail">{{ dimension.detail }}</div>
      <div class="footer">
        <span class="source">{{ dimension.source }}</span>
        <a *ngIf="dimension.link" [routerLink]="dimension.link" class="link">Details</a>
      </div>
    </section>
  `,
  styles: [
    `
      @use 'tokens' as t;
      :host { display: block; min-width: 0; }
      .health { display: flex; flex-direction: column; gap: t.$space-2; padding: t.$space-4 t.$space-5; height: 100%; }
      .top { display: flex; align-items: center; gap: t.$space-2; }
      .icon {
        display: inline-flex; align-items: center; justify-content: center; flex: none;
        width: 28px; height: 28px; border-radius: t.$radius-md; background: t.$gray-100; color: t.$gray-600;
        .mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
      .title { flex: 1; min-width: 0; font-size: t.$fs-base; font-weight: t.$fw-semibold; color: t.$text-secondary; line-height: 1.3; }
      .headline { font-size: t.$fs-lg; font-weight: t.$fw-semibold; margin-top: t.$space-1; }
      .detail {
        font-size: t.$fs-sm; color: t.$text-secondary; overflow: hidden;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      }
      .footer { display: flex; justify-content: space-between; gap: t.$space-2; margin-top: auto; padding-top: t.$space-2; border-top: 1px solid t.$gray-100; }
      .source { font-size: t.$fs-xs; color: t.$text-muted; }
      .link { font-size: t.$fs-xs; font-weight: t.$fw-medium; }
    `,
  ],
})
export class HealthCardComponent {
  @Input({ required: true }) dimension!: HealthDimension;
}
