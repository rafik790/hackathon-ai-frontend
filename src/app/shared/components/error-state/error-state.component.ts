import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiError } from '../../../core/models/api-error.model';

/**
 * Error display. `inline` renders a slim banner (used when stale data is still shown),
 * otherwise a centred block with a retry button.
 */
@Component({
  selector: 'app-error-state',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="inline; else block" class="inline-alert danger" role="alert">
      <mat-icon>error_outline</mat-icon>
      <div class="spacer">
        <strong>{{ error?.title ?? 'Something went wrong' }}.</strong> {{ error?.message }}
      </div>
      <button mat-button color="warn" type="button" (click)="retry.emit()">Retry</button>
    </div>
    <ng-template #block>
      <div class="error" role="alert">
        <span class="icon" aria-hidden="true"><mat-icon>{{ isUnreachable ? 'cloud_off' : 'error_outline' }}</mat-icon></span>
        <h3>{{ error?.title ?? 'Something went wrong' }}</h3>
        <p>{{ error?.message ?? 'The request could not be completed.' }}</p>
        <ul class="fields" *ngIf="error?.fieldErrors?.length">
          <li *ngFor="let fe of error?.fieldErrors"><code>{{ fe.field }}</code> {{ fe.message }}</li>
        </ul>
        <button mat-stroked-button type="button" (click)="retry.emit()"><mat-icon>refresh</mat-icon> Try again</button>
      </div>
    </ng-template>
  `,
  styles: [
    `
      @use 'tokens' as t;
      .error { display: flex; flex-direction: column; align-items: center; text-align: center; padding: t.$space-8 t.$space-6; }
      .icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 44px; height: 44px; border-radius: 50%;
        background: t.$danger-bg; color: t.$danger; margin-bottom: t.$space-3;
      }
      h3 { font-size: t.$fs-md; }
      p { margin: t.$space-1 0 t.$space-4; max-width: 480px; color: t.$text-secondary; font-size: t.$fs-base; }
      .fields { margin: 0 0 t.$space-4; padding: 0; list-style: none; font-size: t.$fs-sm; color: t.$text-secondary; }
      .inline-alert { align-items: center; }
    `,
  ],
})
export class ErrorStateComponent {
  @Input() error: ApiError | null = null;
  @Input() inline = false;
  @Output() readonly retry = new EventEmitter<void>();

  get isUnreachable(): boolean {
    return this.error?.status === 0;
  }
}
