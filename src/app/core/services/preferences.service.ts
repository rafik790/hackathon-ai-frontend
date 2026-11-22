import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { AppEnvironment } from '../../../environments/environment.model';
import { APP_CONFIG } from '../config/app-config';
import { TimeRangePreset } from '../models/dashboard.models';

/** Per-browser display preferences. Nothing here is sent to the backend. */
export interface UserPreferences {
  readonly autoRefresh: boolean;
  readonly refreshIntervalMs: number;
  readonly defaultRange: TimeRangePreset;
  readonly sidebarCollapsed: boolean;
}

const STORAGE_KEY = 'cicd-agent.preferences.v1';
export const REFRESH_INTERVAL_OPTIONS: readonly number[] = [15000, 30000, 60000, 300000];

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly defaults: UserPreferences;
  private readonly state$: BehaviorSubject<UserPreferences>;

  readonly preferences$: Observable<UserPreferences>;

  constructor(@Inject(APP_CONFIG) config: AppEnvironment) {
    this.defaults = {
      autoRefresh: true,
      refreshIntervalMs: config.autoRefreshIntervalMs,
      defaultRange: '7d',
      sidebarCollapsed: false,
    };
    this.state$ = new BehaviorSubject<UserPreferences>({ ...this.defaults, ...this.read() });
    this.preferences$ = this.state$.asObservable();
  }

  get snapshot(): UserPreferences {
    return this.state$.value;
  }

  select<K extends keyof UserPreferences>(key: K): Observable<UserPreferences[K]> {
    return this.state$.pipe(
      map((prefs) => prefs[key]),
      distinctUntilChanged(),
    );
  }

  update(patch: Partial<UserPreferences>): void {
    const next = { ...this.state$.value, ...patch };
    this.state$.next(next);
    this.write(next);
  }

  reset(): void {
    this.state$.next(this.defaults);
    this.write(this.defaults);
  }

  private read(): Partial<UserPreferences> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed: unknown = JSON.parse(raw);
      return sanitize(parsed);
    } catch {
      return {};
    }
  }

  private write(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage unavailable (private mode, quota): preferences simply do not persist.
    }
  }
}

function sanitize(value: unknown): Partial<UserPreferences> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  const source = value as Record<string, unknown>;
  const result: { -readonly [K in keyof UserPreferences]?: UserPreferences[K] } = {};
  if (typeof source['autoRefresh'] === 'boolean') {
    result.autoRefresh = source['autoRefresh'];
  }
  const interval = source['refreshIntervalMs'];
  if (typeof interval === 'number' && REFRESH_INTERVAL_OPTIONS.includes(interval)) {
    result.refreshIntervalMs = interval;
  }
  const range = source['defaultRange'];
  if (range === '24h' || range === '7d' || range === '30d') {
    result.defaultRange = range;
  }
  if (typeof source['sidebarCollapsed'] === 'boolean') {
    result.sidebarCollapsed = source['sidebarCollapsed'];
  }
  return result;
}
