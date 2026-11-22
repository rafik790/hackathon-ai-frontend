import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, filter, map, startWith } from 'rxjs';
import { BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';

/**
 * Builds breadcrumbs from `data.breadcrumb` of each route in the active chain. Detail pages can
 * replace the last label (e.g. "Details" → the PipelineRun name) with `setCurrentLabel`.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly currentLabel = new BehaviorSubject<{ url: string; label: string } | null>(null);
  readonly breadcrumbs$: Observable<readonly BreadcrumbItem[]>;

  constructor(private readonly router: Router) {
    const fromRoutes$ = router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.build(router.routerState.snapshot.root)),
    );
    this.breadcrumbs$ = combineLatest([fromRoutes$, this.currentLabel]).pipe(
      map(([items, override]) => {
        if (!override || items.length === 0 || this.router.url.split('?')[0] !== override.url) {
          return items;
        }
        const last = items[items.length - 1];
        return [...items.slice(0, -1), { ...last, label: override.label }];
      }),
    );
  }

  /** Overrides the label of the current page; cleared automatically when the URL changes. */
  setCurrentLabel(label: string): void {
    this.currentLabel.next({ url: this.router.url.split('?')[0], label });
  }

  private build(root: ActivatedRouteSnapshot): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [];
    const segments: string[] = [];
    let route: ActivatedRouteSnapshot | null = root;
    while (route) {
      segments.push(...route.url.map((segment) => segment.path));
      // Only the route's own configuration counts; inherited data would duplicate crumbs.
      const label: unknown = route.routeConfig?.data?.['breadcrumb'];
      if (typeof label === 'string') {
        items.push({ label, url: '/' + segments.join('/') });
      }
      route = route.firstChild;
    }
    return items;
  }
}
