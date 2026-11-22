import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { PreferencesService } from '../../core/services/preferences.service';

/** Sidebar state: collapsible rail on desktop, overlay drawer below 960px. */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly isHandset$: Observable<boolean>;
  readonly collapsed$: Observable<boolean>;
  private readonly mobileOpen = new BehaviorSubject<boolean>(false);
  readonly mobileOpen$ = this.mobileOpen.asObservable();

  constructor(breakpoints: BreakpointObserver, private readonly preferences: PreferencesService) {
    this.isHandset$ = breakpoints.observe('(max-width: 959.98px)').pipe(
      map((state) => state.matches),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.collapsed$ = preferences.select('sidebarCollapsed');
  }

  toggle(isHandset: boolean): void {
    if (isHandset) {
      this.mobileOpen.next(!this.mobileOpen.value);
    } else {
      this.preferences.update({ sidebarCollapsed: !this.preferences.snapshot.sidebarCollapsed });
    }
  }

  closeMobile(): void {
    this.mobileOpen.next(false);
  }
}
