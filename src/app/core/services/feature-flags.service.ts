import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { ReliabilityAgentApiService } from './reliability-agent-api.service';

/**
 * Optional features the backend switched on. Read once; an older backend without the endpoint, or any error, counts as
 * switched off, so navigation never offers a page that cannot work.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  /** INTERACTIVE_RELIABILITY_AGENT_ENABLED in the backend. */
  readonly reliabilityAgent$: Observable<boolean> = this.reliabilityAgentApi.status().pipe(
    map((status) => status.enabled),
    catchError(() => of(false)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor(private readonly reliabilityAgentApi: ReliabilityAgentApiService) {}
}
