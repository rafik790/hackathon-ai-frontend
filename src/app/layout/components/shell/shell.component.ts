import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest, filter, map } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';
import { LayoutService } from '../../services/layout.service';

/** Application frame: sidebar, top bar, global progress indicator and the routed page. */
@Component({
  selector: 'app-shell',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  readonly vm$ = combineLatest([this.layout.isHandset$, this.layout.collapsed$, this.layout.mobileOpen$]).pipe(
    map(([isHandset, collapsed, mobileOpen]) => ({ isHandset, collapsed: !isHandset && collapsed, mobileOpen })),
  );
  readonly loading$ = this.loading.loading$;

  constructor(private readonly layout: LayoutService, private readonly loading: LoadingService, router: Router) {
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.layout.closeMobile());
  }

  toggleSidebar(isHandset: boolean): void {
    this.layout.toggle(isHandset);
  }

  closeMobile(): void {
    this.layout.closeMobile();
  }
}
