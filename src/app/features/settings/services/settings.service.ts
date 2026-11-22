import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { AppEnvironment } from '../../../../environments/environment.model';
import { APP_CONFIG } from '../../../core/config/app-config';
import { toApiError } from '../../../core/models/load-state';
import { ApplicationInfo } from '../../../core/models/monitoring.models';
import { AppInfoApiService } from '../../../core/services/app-info-api.service';
import { CollectorApiService } from '../../../core/services/collector-api.service';

export interface ConnectivityResult {
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly message: string;
  readonly checkedAt: Date;
}

export interface EndpointInfo {
  readonly label: string;
  readonly url: string;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly appInfo: AppInfoApiService,
    private readonly collectorApi: CollectorApiService,
    @Inject(APP_CONFIG) private readonly config: AppEnvironment,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  info(): Observable<ApplicationInfo> {
    return this.appInfo.info();
  }

  /** Absolute URLs the browser actually calls, resolved against <base href>. */
  endpoints(): EndpointInfo[] {
    return [
      { label: 'REST API', url: this.resolve(this.config.apiBaseUrl) },
      { label: 'Actuator', url: this.resolve(this.config.actuatorBaseUrl) },
      { label: 'API documentation', url: this.resolve(this.config.apiDocsUrl) },
    ];
  }

  get apiDocsUrl(): string {
    return this.resolve(this.config.apiDocsUrl);
  }

  get frontendVersion(): string {
    return this.config.appVersion;
  }

  /** Round-trip to GET /api/v1/collector/status. */
  testConnection(): Observable<ConnectivityResult> {
    const started = performance.now();
    const elapsed = (): number => Math.round(performance.now() - started);
    return this.collectorApi.status().pipe(
      map(() => ({ ok: true, latencyMs: elapsed(), message: 'API reachable', checkedAt: new Date() })),
      catchError((error: unknown) => {
        const apiError = toApiError(error);
        return of({ ok: false, latencyMs: elapsed(), message: `${apiError.title}: ${apiError.message}`, checkedAt: new Date() });
      }),
    );
  }

  private resolve(url: string): string {
    try {
      return new URL(url, this.document.baseURI).href;
    } catch {
      return url;
    }
  }
}
