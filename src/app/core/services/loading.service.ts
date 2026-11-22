import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';

/** Tracks in-flight HTTP requests (fed by LoadingInterceptor) and the last successful response. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly inFlight$ = new BehaviorSubject<number>(0);
  private readonly lastSuccess$ = new BehaviorSubject<Date | null>(null);

  readonly loading$: Observable<boolean> = this.inFlight$.pipe(
    map((count) => count > 0),
    distinctUntilChanged(),
  );

  /** Time of the most recent successful API response, shown as "last refreshed". */
  readonly lastRefreshedAt$: Observable<Date | null> = this.lastSuccess$.asObservable();

  start(): void {
    this.inFlight$.next(this.inFlight$.value + 1);
  }

  stop(): void {
    this.inFlight$.next(Math.max(0, this.inFlight$.value - 1));
  }

  markSuccess(): void {
    this.lastSuccess$.next(new Date());
  }
}
