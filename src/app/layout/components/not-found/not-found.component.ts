import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <app-empty-state icon="explore_off" title="Page not found" message="The page you are looking for does not exist or was moved.">
        <a mat-flat-button color="primary" routerLink="/overview">Back to Overview</a>
      </app-empty-state>
    </div>
  `,
})
export class NotFoundComponent {}
