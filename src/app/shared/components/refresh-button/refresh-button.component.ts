import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-refresh-button',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      *ngIf="!label; else labelled"
      mat-icon-button
      type="button"
      [matTooltip]="tooltip"
      [attr.aria-label]="tooltip"
      [disabled]="disabled"
      (click)="refresh.emit()"
    >
      <mat-icon [class.spin]="loading">refresh</mat-icon>
    </button>
    <ng-template #labelled>
      <button mat-stroked-button type="button" [disabled]="disabled" (click)="refresh.emit()">
        <mat-icon [class.spin]="loading">refresh</mat-icon>
        {{ label }}
      </button>
    </ng-template>
  `,
  styles: [
    `
      .spin { animation: spin 0.9s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
    `,
  ],
})
export class RefreshButtonComponent {
  @Input() loading = false;
  @Input() disabled = false;
  @Input() label: string | null = null;
  @Input() tooltip = 'Refresh';
  @Output() readonly refresh = new EventEmitter<void>();
}
