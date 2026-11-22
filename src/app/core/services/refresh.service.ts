import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import {
  EMPTY,
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  interval,
  map,
  merge,
  share,
  startWith,
  switchMap,
} from 'rxjs';
import { PreferencesService } from './preferences.service';

/**
 * Central refresh clock. Every data view loads on `trigger$`, so the toolbar refresh button and
 * auto-refresh reload everything that is on screen at once. Auto-refresh pauses while the browser
 * tab is hidden.
 */
@Injectable({ providedIn: 'root' })
export class RefreshService {
  private readonly manual$ = new Subject<void>();

  /** Manual refreshes and auto-refresh ticks. */
  readonly ticks$: Observable<void>;

  constructor(preferences: PreferencesService, @Inject(DOCUMENT) document: Document) {
    const visible$ = fromEvent(document, 'visibilitychange').pipe(
      map(() => document.visibilityState !== 'hidden'),
      startWith(document.visibilityState !== 'hidden'),
      distinctUntilChanged(),
    );
    const auto$ = combineLatest([preferences.select('autoRefresh'), preferences.select('refreshIntervalMs'), visible$]).pipe(
      switchMap(([enabled, intervalMs, visible]) => (enabled && visible ? interval(intervalMs) : EMPTY)),
      map((): void => undefined),
    );
    this.ticks$ = merge(this.manual$, auto$).pipe(share());
  }

  /** Emits immediately, then on every refresh tick. Use as the trigger of a load. */
  get trigger$(): Observable<void> {
    return this.ticks$.pipe(startWith(undefined));
  }

  refresh(): void {
    this.manual$.next();
  }
}
