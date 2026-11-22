import { Injectable } from '@angular/core';
import { Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { LoadState, loadOnTrigger } from '../models/load-state';
import { CollectorHealthState, CollectorStatus } from '../models/monitoring.models';
import { collectorHealth } from '../utils/collector-health';
import { CollectorApiService } from './collector-api.service';
import { RefreshService } from './refresh.service';

/**
 * Shared collector status. The top bar, Overview, Monitoring and Settings pages, and the namespace
 * filters all read this one stream, so the status endpoint is called once per refresh tick.
 */
@Injectable({ providedIn: 'root' })
export class CollectorStatusStore {
  readonly state$: Observable<LoadState<CollectorStatus>>;
  readonly health$: Observable<CollectorHealthState>;
  /** Namespaces the backend monitors; used to populate namespace filters. */
  readonly namespaces$: Observable<readonly string[]>;

  constructor(api: CollectorApiService, refresh: RefreshService) {
    this.state$ = loadOnTrigger(refresh.trigger$, () => api.status()).pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.health$ = this.state$.pipe(
      map((state) => (state.error && !state.data ? 'UNREACHABLE' : collectorHealth(state.data))),
      distinctUntilChanged(),
    );
    this.namespaces$ = this.state$.pipe(
      map((state) => state.data?.namespaces ?? []),
      distinctUntilChanged((a, b) => a.length === b.length && a.every((value, index) => value === b[index])),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
