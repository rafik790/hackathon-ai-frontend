import { InjectionToken } from '@angular/core';
import { AppEnvironment } from '../../../environments/environment.model';
import { environment } from '../../../environments/environment';

/** Runtime configuration, injectable so that services stay testable. */
export const APP_CONFIG = new InjectionToken<AppEnvironment>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => environment,
});

/** Joins a base and a path without duplicating slashes. */
export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
