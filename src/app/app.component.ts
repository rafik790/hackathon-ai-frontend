import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  constructor(iconRegistry: MatIconRegistry) {
    // Self-hosted outlined icon font (node_modules/material-icons), no external CDN required.
    iconRegistry.setDefaultFontSetClass('material-icons-outlined');
  }
}
